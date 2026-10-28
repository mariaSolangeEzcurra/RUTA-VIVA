import type { AnyRecord, DatasetKind, HistoricoRow, ImportIssue, Persona, Siniestro, SourceRef, StoreState, Vehiculo } from '../types/data';
import { fieldSchemas, PILOT_REGION } from '../data/fieldSchemas';
import type { ParsedSheet } from './excel';
import { sensitiveHeaders } from './excel';
import { classifyCoord, parseDate, parseIntValue, parseTime } from './parsing';
import { cleanLabel, normalizeText } from './text';

export type ImportScope = 'region' | 'pais';
export type WideMetric = 'siniestros' | 'fallecidos' | 'lesionados';

export interface ImportOptions {
  importId: string;
  fileName: string;
  sheetName: string;
  declaredSource: string;
  preliminar: boolean;
  scope: ImportScope;
  wide: boolean;
  wideMetric: WideMetric;
}

export interface FieldDiff {
  field: string;
  existing: string;
  incoming: string;
  incomingValue: string | number | boolean | null;
  fillable: boolean;
}

export interface PreparedConflict {
  key: string;
  record: AnyRecord;
  diffs: FieldDiff[];
}

export interface ValidationResult {
  kind: DatasetKind;
  read: number;
  toInsert: AnyRecord[];
  conflicts: PreparedConflict[];
  duplicadosArchivo: number;
  duplicadosExistentes: number;
  rechazados: number;
  pendientes: number;
  fueraAmbito: number;
  issues: ImportIssue[];
  missingRequired: string[];
  unmappedColumns: string[];
  sensitiveIgnored: string[];
  warnings: string[];
  blocking: string | null;
}

export function recordKey(kind: DatasetKind, r: AnyRecord): string {
  return kind === 'siniestros' ? (r as Siniestro).codigo : (r as Persona | Vehiculo | HistoricoRow).key;
}

const IGNORED_COMPARE = new Set(['source', 'key', 'codigo', 'preliminar']);

function display(v: unknown): string {
  if (v === null || v === undefined) return 'Sin dato';
  return String(v);
}

export function diffRecords(existing: AnyRecord, incoming: AnyRecord): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const e = existing as unknown as Record<string, unknown>;
  const n = incoming as unknown as Record<string, unknown>;
  for (const field of Object.keys(n)) {
    if (IGNORED_COMPARE.has(field)) continue;
    const iv = n[field];
    if (iv === null || iv === undefined) continue;
    if (JSON.stringify(e[field]) === JSON.stringify(iv)) continue;
    diffs.push({
      field,
      existing: display(e[field]),
      incoming: display(iv),
      incomingValue: iv as string | number | boolean | null,
      fillable: e[field] === null || e[field] === undefined
    });
  }
  return diffs;
}

function isAreq(dep: string | null): boolean {
  return dep !== null && normalizeText(dep).includes(PILOT_REGION);
}

export function validateSheet(sheet: ParsedSheet, kind: DatasetKind, mapping: Record<string, string | null>, opts: ImportOptions, state: StoreState): ValidationResult {
  const result: ValidationResult = {
    kind, read: sheet.rows.length, toInsert: [], conflicts: [], duplicadosArchivo: 0, duplicadosExistentes: 0,
    rechazados: 0, pendientes: 0, fueraAmbito: 0, issues: [], missingRequired: [], unmappedColumns: [],
    sensitiveIgnored: sensitiveHeaders(sheet.headers), warnings: [], blocking: null
  };
  if (sheet.empty) {
    result.blocking = 'La hoja seleccionada está vacía o no contiene registros bajo el encabezado.';
    return result;
  }
  const fields = fieldSchemas[kind];
  const isWide = kind === 'historico' && opts.wide;
  result.missingRequired = fields.filter((f) => f.required && !mapping[f.key] && !(isWide && f.key === 'anio')).map((f) => f.label);
  if (result.missingRequired.length) {
    result.blocking = `Faltan campos obligatorios sin relacionar: ${result.missingRequired.join(', ')}. Relaciónelos manualmente para continuar.`;
    return result;
  }
  const mappedHeaders = new Set(Object.values(mapping).filter(Boolean) as string[]);
  const yearHeaders = new Set(sheet.yearColumns.map((y) => y.header));
  result.unmappedColumns = sheet.headers.filter((h) => !mappedHeaders.has(h) && !(isWide && yearHeaders.has(h)) && !result.sensitiveIgnored.includes(h));

  const idx: Record<string, number> = {};
  for (const [k, h] of Object.entries(mapping)) if (h) idx[k] = sheet.headers.indexOf(h);
  const get = (row: unknown[], k: string): unknown => idx[k] === undefined || idx[k] < 0 ? null : row[idx[k]];

  const existingList: AnyRecord[] = state[kind] as AnyRecord[];
  const existing = new Map<string, AnyRecord>(existingList.map((r) => [recordKey(kind, r), r]));
  const siniestroCodes = new Set(state.siniestros.map((s) => s.codigo));
  if ((kind === 'personas' || kind === 'vehiculos') && siniestroCodes.size === 0) {
    result.warnings.push('No hay siniestros en la base. Importe primero el archivo de siniestros para poder verificar las relaciones.');
    if (opts.scope === 'region') {
      result.blocking = 'Con el ámbito “Región Arequipa” las personas y vehículos solo se incorporan si su siniestro existe en la base. Importe primero los siniestros.';
      return result;
    }
  }

  const seen = new Map<string, AnyRecord>();
  const ordinal = new Map<string, number>();
  const issue = (row: number, severity: ImportIssue['severity'], message: string, field?: string) => {
    if (result.issues.length < 5000) result.issues.push({ row, severity, message, field });
  };

  const accept = (rowNo: number, rec: AnyRecord, hasWarnings: boolean) => {
    const key = recordKey(kind, rec);
    const prev = seen.get(key);
    if (prev) {
      result.duplicadosArchivo++;
      if (diffRecords(prev, rec).length) issue(rowNo, 'advertencia', `Clave ${key} repetida en el archivo con valores distintos; se conserva la primera aparición.`);
      return;
    }
    seen.set(key, rec);
    const ex = existing.get(key);
    if (ex) {
      const diffs = diffRecords(ex, rec);
      if (diffs.length === 0) result.duplicadosExistentes++;else
      result.conflicts.push({ key, record: rec, diffs });
      return;
    }
    if (hasWarnings) result.pendientes++;
    result.toInsert.push(rec);
  };

  sheet.rows.forEach((row, i) => {
    const rowNo = i + 1;
    const source: SourceRef = { importId: opts.importId, file: opts.fileName, sheet: opts.sheetName, row: rowNo, declaredSource: opts.declaredSource };

    if (kind === 'siniestros') {
      const codigo = cleanLabel(get(row, 'codigo'));
      if (!codigo) {result.rechazados++;issue(rowNo, 'error', 'Código de siniestro vacío.', 'codigo');return;}
      const fecha = parseDate(get(row, 'fecha'));
      if (!fecha.value) {result.rechazados++;issue(rowNo, 'error', fecha.error ?? 'Fecha obligatoria ausente.', 'fecha');return;}
      let warn = false;
      const fechaYear = Number(fecha.value.slice(0, 4));
      const anioCol = parseIntValue(get(row, 'anio'));
      if (anioCol !== null && anioCol !== fechaYear) {warn = true;issue(rowNo, 'advertencia', `Año declarado (${anioCol}) distinto del año de la fecha (${fechaYear}); se usa el de la fecha.`, 'anio');}
      const hora = parseTime(get(row, 'hora'));
      if (hora.error) {warn = true;issue(rowNo, 'advertencia', hora.error, 'hora');}
      const coord = mapping.lat && mapping.lon ? classifyCoord(get(row, 'lat'), get(row, 'lon')) : { lat: null, lon: null, status: 'faltante' as const };
      if (coord.status !== 'valida') {warn = true;issue(rowNo, 'advertencia', `Coordenadas: ${coord.status.replace('_', ' ')}. Se excluye del análisis espacial.`, 'lat');}
      const departamento = cleanLabel(get(row, 'departamento'));
      const inScope = isAreq(departamento) || departamento === null && coord.status === 'valida';
      if (opts.scope === 'region' && !inScope) {result.fueraAmbito++;return;}
      const ints: Record<string, number | null> = {};
      for (const k of ['fallecidosFuente', 'lesionadosFuente', 'vehiculosFuente']) {
        const raw = get(row, k);
        const v = parseIntValue(raw);
        if (raw !== null && String(raw).trim() !== '' && v === null) {warn = true;issue(rowNo, 'advertencia', `Valor no entero en ${k}: ${String(raw)}. Se registra como sin dato.`, k);}
        ints[k] = v;
      }
      const rec: Siniestro = {
        codigo, fecha: fecha.value, anio: fechaYear, hora: hora.value,
        departamento, provincia: cleanLabel(get(row, 'provincia')), distrito: cleanLabel(get(row, 'distrito')),
        direccion: cleanLabel(get(row, 'direccion')), via: cleanLabel(get(row, 'via')), redVial: cleanLabel(get(row, 'redVial')),
        kilometro: cleanLabel(get(row, 'kilometro')), lat: coord.lat, lon: coord.lon, coordStatus: coord.status,
        clase: cleanLabel(get(row, 'clase')), causa: cleanLabel(get(row, 'causa')),
        fallecidosFuente: ints.fallecidosFuente, lesionadosFuente: ints.lesionadosFuente, vehiculosFuente: ints.vehiculosFuente,
        preliminar: opts.preliminar, source
      };
      accept(rowNo, rec, warn);
      return;
    }

    if (kind === 'personas' || kind === 'vehiculos') {
      const cod = cleanLabel(get(row, 'codigoSiniestro'));
      if (!cod) {result.rechazados++;issue(rowNo, 'error', 'Código de siniestro vacío; no se puede vincular.', 'codigoSiniestro');return;}
      let warn = false;
      if (!siniestroCodes.has(cod)) {
        if (opts.scope === 'region') {result.fueraAmbito++;return;}
        warn = true;
        issue(rowNo, 'advertencia', `Sin siniestro vinculado en la base (${cod}). Queda pendiente de vinculación.`, 'codigoSiniestro');
      }
      const idField = kind === 'personas' ? 'idPersona' : 'idVehiculo';
      const ownId = cleanLabel(get(row, idField));
      const n = (ordinal.get(cod) ?? 0) + 1;
      ordinal.set(cod, n);
      const key = ownId ? `${cod}|${ownId}` : `${cod}|#${n}`;
      if (kind === 'personas') {
        const edadRaw = get(row, 'edad');
        let edad = parseIntValue(edadRaw);
        if (edad !== null && edad > 110) {edad = null;warn = true;issue(rowNo, 'advertencia', `Edad fuera de rango (${String(edadRaw)}).`, 'edad');}
        const rec: Persona = { key, codigoSiniestro: cod, condicion: cleanLabel(get(row, 'condicion')), tipoUsuario: cleanLabel(get(row, 'tipoUsuario')), edad, sexo: cleanLabel(get(row, 'sexo')), preliminar: opts.preliminar, source };
        accept(rowNo, rec, warn);
      } else {
        const rec: Vehiculo = { key, codigoSiniestro: cod, tipo: cleanLabel(get(row, 'tipo')), servicio: cleanLabel(get(row, 'servicio')), preliminar: opts.preliminar, source };
        accept(rowNo, rec, warn);
      }
      return;
    }

    // historico
    const ambito = cleanLabel(get(row, 'ambito')) ?? 'ÁMBITO NO DECLARADO';
    if (isWide) {
      for (const yc of sheet.yearColumns) {
        const raw = row[sheet.headers.indexOf(yc.header)];
        if (raw === null || String(raw).trim() === '') continue;
        const v = parseIntValue(raw);
        if (v === null) {issue(rowNo, 'advertencia', `Valor no entero para ${yc.year}: ${String(raw)}.`);continue;}
        const rec: HistoricoRow = { key: `${yc.year}|${ambito}`, anio: yc.year, ambito, siniestros: null, fallecidos: null, lesionados: null, preliminar: opts.preliminar, source };
        rec[opts.wideMetric] = v;
        accept(rowNo, rec, false);
      }
      return;
    }
    const anio = parseIntValue(get(row, 'anio'));
    if (anio === null || anio < 1990 || anio > 2100) {result.rechazados++;issue(rowNo, 'error', `Año inválido (${String(get(row, 'anio'))}).`, 'anio');return;}
    const rec: HistoricoRow = {
      key: `${anio}|${ambito}`, anio, ambito,
      siniestros: parseIntValue(get(row, 'siniestros')), fallecidos: parseIntValue(get(row, 'fallecidos')), lesionados: parseIntValue(get(row, 'lesionados')),
      preliminar: opts.preliminar, source
    };
    accept(rowNo, rec, false);
  });

  if (result.sensitiveIgnored.length) result.warnings.push(`Columnas con datos personales no importadas: ${result.sensitiveIgnored.join(', ')}.`);
  if (result.unmappedColumns.length) result.warnings.push(`${result.unmappedColumns.length} columnas sin correspondencia no se incorporan.`);
  if (result.fueraAmbito) result.warnings.push(`${result.fueraAmbito} registros fuera del ámbito Región Arequipa no se incorporan.`);
  if (result.toInsert.length === 0 && result.conflicts.length === 0) result.warnings.push('No hay registros nuevos ni actualizaciones para incorporar.');
  return result;
}