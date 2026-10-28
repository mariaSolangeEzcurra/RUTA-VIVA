import * as XLSX from 'xlsx';
import type { Intervention, Persona, Siniestro, StoreState, Vehiculo } from '../types/data';
import { autoMap, detectKind, parseWorkbook } from './excel';
import type { ParsedSheet } from './excel';
import { classifyCoord, parseDate, parseIntValue, parseTime } from './parsing';
import { cleanLabel } from './text';
import { dbscan, haversine } from './geo';
import { validateSheet } from './importValidation';
import type { ImportOptions } from './importValidation';
import { commitImport } from './importCommit';
import { buildViews, computeTotals } from './metrics';
import { runAnalysis } from './analysis';
import { applyFilters, emptyFilters } from './filters';
import { explainZone } from './explain';
import { transition } from './interventions';
import { buildZonePdf } from './pdf';
import { qualityReport } from './quality';
import { recommendForZone } from './recommend';
import { assessEntity } from './entity';
import { createEmptyState } from './store';

export interface TestResult {
  name: string;
  group: string;
  passed: boolean;
  message: string;
  ms: number;
}

class AssertionError extends Error {}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new AssertionError(msg);
}

/* Datos de prueba sintéticos: solo existen dentro de las pruebas y nunca se muestran como datos reales. */
const opts = (id: string): ImportOptions => ({ importId: id, fileName: 'prueba.xlsx', sheetName: 'H1', declaredSource: 'Fixture de prueba', preliminar: true, scope: 'region', wide: false, wideMetric: 'siniestros' });

function sheet(headers: string[], rows: unknown[][]): ParsedSheet {
  return { name: 'H1', headerRowIndex: 0, headers, rows, empty: rows.length === 0, yearColumns: [] };
}

const SIN_HEADERS = ['CODIGO SINIESTRO', 'FECHA SINIESTRO', 'HORA', 'DEPARTAMENTO', 'PROVINCIA', 'LATITUD', 'LONGITUD', 'CLASE SINIESTRO', 'FALLECIDOS'];
const clusterRows = (prefix: string, year: number): unknown[][] => [
[`${prefix}1`, `10/02/${year}`, '21:10', 'AREQUIPA', 'AREQUIPA', -16.4, -71.53, 'ATROPELLO', 1],
[`${prefix}2`, `11/03/${year}`, '22:00', 'AREQUIPA', 'AREQUIPA', -16.4005, -71.5302, 'ATROPELLO', 1],
[`${prefix}3`, `12/04/${year}`, '23:30', 'AREQUIPA', 'AREQUIPA', -16.4009, -71.5298, 'ATROPELLO', 2]];


async function importRows(state: StoreState, rows: unknown[][], id: string): Promise<StoreState> {
  const sh = sheet(SIN_HEADERS, rows);
  const vr = validateSheet(sh, 'siniestros', autoMap('siniestros', SIN_HEADERS), opts(id), state);
  const res = await commitImport(state, vr, { options: opts(id), fileSize: 1, period: null, mapping: {}, startedAt: new Date().toISOString() }, 'conservar', async () => undefined);
  return res.state;
}

type TestDef = {group: string;name: string;run: () => void | Promise<void>;};

const tests: TestDef[] = [
{ group: 'Valores faltantes', name: 'Los faltantes no se convierten en cero', run: () => {
    assert(cleanLabel('') === null && cleanLabel('S/D') === null, 'cleanLabel debe devolver null');
    assert(parseIntValue('') === null && parseIntValue(null) === null, 'parseIntValue vacío debe ser null');
    assert(parseIntValue('0') === 0, 'Un cero explícito se conserva');
  } },
{ group: 'Fechas y horas', name: 'Fechas Excel, dd/mm/aaaa e inválidas', run: () => {
    assert(parseDate(44562).value === '2022-01-01', `Serie 44562 → ${parseDate(44562).value}`);
    assert(parseDate('15/03/2023').value === '2023-03-15', 'dd/mm/aaaa');
    assert(parseDate('31/02/2022').value === null && !!parseDate('31/02/2022').error, 'Fecha imposible debe fallar');
  } },
{ group: 'Fechas y horas', name: 'Horas en fracción, AM/PM y fuera de rango', run: () => {
    assert(parseTime(0.5).value === '12:00', 'Fracción 0.5');
    assert(parseTime('7:30 PM').value === '19:30', 'AM/PM');
    assert(parseTime('25:00').value === null, 'Hora 25 inválida');
  } },
{ group: 'Coordenadas', name: 'Clasificación de coordenadas', run: () => {
    assert(classifyCoord(-16.4, -71.53).status === 'valida', 'Arequipa válida');
    assert(classifyCoord(0, 0).status === 'cero', 'Cero');
    assert(classifyCoord(-71.53, -16.4).status === 'invertida', 'Invertida');
    assert(classifyCoord('abc', 'x').status === 'no_numerica', 'No numérica');
    assert(classifyCoord(-12.05, -77.04).status === 'fuera_region', 'Lima fuera de región');
    assert(classifyCoord(null, -71).status === 'faltante', 'Faltante');
    assert(classifyCoord('-16,40', '-71,53').status === 'valida', 'Coma decimal');
  } },
{ group: 'Análisis espacial', name: 'Haversine en metros', run: () => {
    const d = haversine(0, 0, 0, 1);
    assert(Math.abs(d - 111195) < 2, `1° de longitud en el ecuador ≈ 111 195 m (obtenido ${d.toFixed(0)})`);
  } },
{ group: 'Análisis espacial', name: 'DBSCAN agrupa y marca ruido', run: () => {
    const labels = dbscan([{ id: 'a', lat: -16.4, lon: -71.53 }, { id: 'b', lat: -16.4003, lon: -71.53 }, { id: 'c', lat: -16.4, lon: -71.5303 }, { id: 'd', lat: -16.5, lon: -71.6 }], 100, 3);
    assert(labels[0] === 0 && labels[1] === 0 && labels[2] === 0 && labels[3] === -1, `Etiquetas ${labels.join(',')}`);
  } },
{ group: 'Columnas', name: 'Correspondencia automática de columnas', run: () => {
    const m = autoMap('siniestros', ['CÓDIGO SINIESTRO', 'FECHA SINIESTRO', 'COORDENADAS LATITUD', 'COORDENADAS LONGITUD', 'RED VIAL', 'CÓDIGO DE VÍA', 'DNI CONDUCTOR']);
    assert(m.codigo === 'CÓDIGO SINIESTRO' && m.fecha === 'FECHA SINIESTRO', 'código y fecha');
    assert(m.lat === 'COORDENADAS LATITUD' && m.lon === 'COORDENADAS LONGITUD', 'coordenadas');
    assert(m.redVial === 'RED VIAL' && m.via === 'CÓDIGO DE VÍA', 'red y vía');
    assert(!Object.values(m).includes('DNI CONDUCTOR'), 'Columnas personales nunca se relacionan');
  } },
{ group: 'Columnas', name: 'Detección del tipo de archivo', run: () => {
    const k = detectKind(sheet(['CODIGO SINIESTRO', 'EDAD', 'SEXO', 'TIPO USUARIO', 'CONDICION'], [[1, 1, 1, 1, 1]]), 'x.xlsx');
    assert(k.kind === 'personas', `Detectado ${k.kind}`);
  } },
{ group: 'Lectura Excel', name: 'Lectura real de libro, fila de título y hoja vacía', run: () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Título del reporte'], SIN_HEADERS, ...clusterRows('X', 2022)]), 'Datos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Vacia');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const parsed = parseWorkbook(buf, 'f.xlsx', buf.byteLength);
    assert(parsed.format === 'xlsx', 'Formato xlsx');
    assert(parsed.sheets[0].headerRowIndex === 1 && parsed.sheets[0].rows.length === 3, 'Encabezado detectado tras título');
    assert(parsed.sheets[1].empty, 'Hoja vacía detectada');
  } },
{ group: 'Lectura Excel', name: 'Rechazo de contenido no Excel', run: () => {
    let threw = false;
    try {parseWorkbook(new TextEncoder().encode('hola,mundo').buffer as ArrayBuffer, 'falso.xlsx', 10);} catch {threw = true;}
    assert(threw, 'Debe rechazar firma inválida');
  } },
{ group: 'Validación', name: 'Duplicados, fechas y coordenadas inválidas', run: () => {
    const rows = [...clusterRows('A', 2022), clusterRows('A', 2022)[0], ['A9', '32/13/2022', '', 'AREQUIPA', 'X', -16.4, -71.5, 'CHOQUE', 1], ['A10', '01/01/2022', '', 'AREQUIPA', 'X', 0, 0, 'CHOQUE', null], ['L1', '01/01/2022', '', 'LIMA', 'LIMA', -12.05, -77.04, 'CHOQUE', 1]];
    const vr = validateSheet(sheet(SIN_HEADERS, rows), 'siniestros', autoMap('siniestros', SIN_HEADERS), opts('T1'), createEmptyState());
    assert(vr.toInsert.length === 4, `Insertables ${vr.toInsert.length}`);
    assert(vr.duplicadosArchivo === 1, 'Un duplicado en archivo');
    assert(vr.rechazados === 1, 'Una fecha inválida rechazada');
    assert(vr.pendientes === 1, 'Coordenada cero pendiente');
    assert(vr.fueraAmbito === 1, 'Lima fuera de ámbito');
    const a10 = vr.toInsert.find((r) => (r as Siniestro).codigo === 'A10') as Siniestro;
    assert(a10.fallecidosFuente === null, 'Fallecidos vacío permanece null');
  } },
{ group: 'Validación', name: 'Campos obligatorios ausentes bloquean', run: () => {
    const vr = validateSheet(sheet(['X', 'Y2'], [[1, 2]]), 'siniestros', { codigo: null, fecha: null }, opts('T2'), createEmptyState());
    assert(!!vr.blocking && vr.missingRequired.length === 2, 'Debe bloquear');
  } },
{ group: 'Importación', name: 'Conflictos y políticas de actualización', run: async () => {
    const s1 = await importRows(createEmptyState(), clusterRows('C', 2022), 'I1');
    const changed = clusterRows('C', 2022).map((r, i) => i === 0 ? [...r.slice(0, 7), 'CHOQUE', r[8]] : r);
    const vr = validateSheet(sheet(SIN_HEADERS, changed), 'siniestros', autoMap('siniestros', SIN_HEADERS), opts('I2'), s1);
    assert(vr.conflicts.length === 1 && vr.duplicadosExistentes === 2, 'Un conflicto, dos duplicados');
    const meta = { options: opts('I2'), fileSize: 1, period: null, mapping: {}, startedAt: '' };
    const keep = await commitImport(s1, vr, meta, 'conservar', async () => undefined);
    assert(keep.state.siniestros.find((s) => s.codigo === 'C1')?.clase === 'ATROPELLO', 'Conservar no sobrescribe');
    assert(keep.state.conflicts.some((c) => c.resolution === 'pendiente'), 'Conflicto registrado');
    const over = await commitImport(s1, vr, meta, 'sobrescribir', async () => undefined);
    assert(over.state.siniestros.find((s) => s.codigo === 'C1')?.clase === 'CHOQUE', 'Sobrescribir aplica regla explícita');
    assert(over.state.siniestros.length === 3, 'Sin duplicación');
  } },
{ group: 'Importación', name: 'Rollback ante error de persistencia', run: async () => {
    const base = createEmptyState();
    const vr = validateSheet(sheet(SIN_HEADERS, clusterRows('R', 2022)), 'siniestros', autoMap('siniestros', SIN_HEADERS), opts('R1'), base);
    let threw = false;
    try {await commitImport(base, vr, { options: opts('R1'), fileSize: 1, period: null, mapping: {}, startedAt: '' }, 'conservar', async () => {throw new Error('fallo simulado');});} catch {threw = true;}
    assert(threw && base.siniestros.length === 0 && base.dataVersion === 0, 'El estado original queda intacto');
  } },
{ group: 'Importación', name: 'Historial y versión de datos', run: async () => {
    const s = await importRows(createEmptyState(), clusterRows('H', 2022), 'HX');
    assert(s.imports.length === 1 && s.imports[0].dataVersion === 1 && s.imports[0].nuevos === 3, 'Registro de importación');
  } },
{ group: 'Relaciones', name: 'Personas y vehículos no multiplican siniestros', run: () => {
    const st = createEmptyState();
    const src = { importId: 'x', file: 'f', sheet: 's', row: 1, declaredSource: 't' };
    st.siniestros = [{ codigo: 'P1', fecha: '2022-01-01', anio: 2022, hora: null, departamento: 'AREQUIPA', provincia: null, distrito: null, direccion: null, via: null, redVial: null, kilometro: null, lat: -16.4, lon: -71.5, coordStatus: 'valida', clase: null, causa: null, fallecidosFuente: 3, lesionadosFuente: null, vehiculosFuente: null, preliminar: true, source: src }];
    const p = (k: string, c: string): Persona => ({ key: k, codigoSiniestro: 'P1', condicion: c, tipoUsuario: 'PEATON', edad: 30, sexo: null, preliminar: true, source: src });
    st.personas = [p('1', 'FALLECIDO'), p('2', 'FALLECIDO'), p('3', 'LESIONADO')];
    const v = (k: string): Vehiculo => ({ key: k, codigoSiniestro: 'P1', tipo: 'AUTOMOVIL', servicio: null, preliminar: true, source: src });
    st.vehiculos = [v('1'), v('2')];
    const views = buildViews(st, null);
    const t = computeTotals(views);
    assert(views.length === 1 && t.fallecidos === 2 && t.lesionados === 1, `Conteos ${views.length}/${t.fallecidos}/${t.lesionados}`);
    assert(views[0].conteoDiscrepante, 'Discrepancia con conteo de la fuente detectada');
  } },
{ group: 'Indicadores', name: 'Fallecidos no disponibles permanecen sin dato', run: () => {
    const t = computeTotals([]);
    assert(t.fallecidos === null && t.coordShare === null, 'Sin datos → null');
  } },
{ group: 'IPIV', name: 'Recálculo tras importación, contribuciones y explicación', run: async () => {
    let s = await importRows(createEmptyState(), [...clusterRows('Z', 2022), ...clusterRows('Y', 2023).map((r) => [r[0], r[1], r[2], r[3], r[4], (r[5] as number) - 0.2, (r[6] as number) - 0.2, 'DESPISTE', 1])], 'IP1');
    const a1 = runAnalysis(s);
    assert(a1.zones.length === 2 && a1.dataVersion === s.dataVersion, `Zonas ${a1.zones.length}`);
    s = await importRows({ ...s, analysis: a1 }, clusterRows('W', 2024).map((r) => [r[0], r[1], r[2], r[3], r[4], (r[5] as number) - 0.0002, r[6], r[7], r[8]]), 'IP2');
    const a2 = runAnalysis(s);
    assert(a2.dataVersion === 2 && a2.zones[0].siniestros === 6, 'La zona incorpora los nuevos registros');
    for (const z of a2.zones) {
      const sum = Object.values(z.criteria).reduce((acc, c) => acc + (c.contribution ?? 0), 0);
      assert(Math.abs(sum - z.ipiv) < 0.2, `Suma de aportes ${sum} ≠ IPIV ${z.ipiv}`);
      assert(z.criteria.entorno.contribution === null && z.criteria.exposicion.contribution === null, 'Criterios sin capa excluidos');
    }
    const ex = explainZone(a2.zones[0], a2);
    assert(ex.pattern.includes('ATROPELLO') && ex.contributors.length > 0, 'Explicación basada en datos');
    assert(recommendForZone(a2.zones[0]).some((r) => r.measure.trigger === 'atropello_nocturno'), 'Regla de atropello nocturno');
    assert(!assessEntity(a2.zones[0], undefined).confirmed, 'Entidad no se asigna sin verificación');
  } },
{ group: 'Filtros', name: 'Consistencia de filtros', run: async () => {
    const s = await importRows(createEmptyState(), [...clusterRows('F', 2022), ['G1', '01/01/2023', '', 'AREQUIPA', 'ISLAY', -17.0, -71.9, 'CHOQUE', 1]], 'F1');
    const v = buildViews(s, null);
    assert(applyFilters(v, emptyFilters).length === 4, 'Sin filtros');
    assert(applyFilters(v, { ...emptyFilters, provincia: 'ISLAY' }).length === 1, 'Provincia');
    assert(applyFilters(v, { ...emptyFilters, yearFrom: 2023 }).length === 1, 'Año');
    assert(s.siniestros.length === 4, 'Los filtros no alteran los datos');
  } },
{ group: 'Seguimiento', name: 'Transiciones de estado controladas', run: () => {
    const iv: Intervention = { id: 'i', zoneId: 'z', zoneLabel: 'z', zoneCentroid: [0, 0], zoneRadiusM: 0, zoneMemberCodes: [], measureId: 'm', measureLabel: 'm', entity: null, responsable: null, state: 'identificada', observations: '', documents: [], history: [], createdAt: '', executedOn: null };
    let threw = false;
    try {transition(iv, 'aprobada', 'x', '2024-01-01');} catch {threw = true;}
    assert(threw, 'No se puede aprobar desde identificada');
    const p = transition(iv, 'pendiente_inspeccion', '', '2024-01-01');
    let needsNote = false;
    try {transition(p, 'evaluada', '', '2024-01-01');} catch {needsNote = true;}
    assert(needsNote && p.history.length === 1, 'Evaluación requiere sustento');
  } },
{ group: 'Fichas PDF', name: 'Generación de ficha técnica', run: async () => {
    const s = await importRows(createEmptyState(), clusterRows('Q', 2022), 'Q1');
    const a = runAnalysis(s);
    const z = a.zones[0];
    const members = buildViews(s, a).filter((v) => z.memberCodes.includes(v.codigo));
    const doc = buildZonePdf({ zone: z, snapshot: a, members, explanation: explainZone(z, a), recommendations: recommendForZone(z), quality: qualityReport(members), entity: assessEntity(z, undefined), interventions: [], dataVersion: s.dataVersion });
    const bytes = doc.output('arraybuffer').byteLength;
    assert(bytes > 2000, `PDF de ${bytes} bytes`);
  } }];


export async function runSelfTests(): Promise<TestResult[]> {
  const out: TestResult[] = [];
  for (const t of tests) {
    const start = performance.now();
    try {
      await t.run();
      out.push({ name: t.name, group: t.group, passed: true, message: 'Correcto', ms: performance.now() - start });
    } catch (e) {
      out.push({ name: t.name, group: t.group, passed: false, message: e instanceof Error ? e.message : String(e), ms: performance.now() - start });
    }
  }
  return out;
}