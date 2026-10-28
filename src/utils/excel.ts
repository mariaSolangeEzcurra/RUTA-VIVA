import * as XLSX from 'xlsx';
import type { DatasetKind } from '../types/data';
import { fieldSchemas, sensitiveHeaderTokens } from '../data/fieldSchemas';
import { normalizeText, tokens } from './text';

export interface ParsedSheet {
  name: string;
  headerRowIndex: number;
  headers: string[];
  rows: unknown[][];
  empty: boolean;
  yearColumns: {header: string;year: number;}[];
}

export interface ParsedWorkbook {
  fileName: string;
  size: number;
  format: 'xlsx' | 'xls';
  sheets: ParsedSheet[];
}

/** Verifica la firma binaria: ZIP (xlsx) o OLE2 (xls). No se aceptan otros contenidos. */
export function detectSignature(buf: ArrayBuffer): 'xlsx' | 'xls' | null {
  const b = new Uint8Array(buf.slice(0, 8));
  if (b[0] === 0x50 && b[1] === 0x4b) return 'xlsx';
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return 'xls';
  return null;
}

function isSensitive(header: string): boolean {
  const t = tokens(header);
  return t.some((x) => sensitiveHeaderTokens.includes(x));
}

function parseSheet(name: string, ws: XLSX.WorkSheet): ParsedSheet {
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null, blankrows: false });
  const nonEmpty = aoa.filter((r) => Array.isArray(r) && r.some((c) => c !== null && String(c).trim() !== ''));
  if (nonEmpty.length === 0) return { name, headerRowIndex: -1, headers: [], rows: [], empty: true, yearColumns: [] };

  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(aoa.length, 20); i++) {
    const row = aoa[i] ?? [];
    const score = row.filter((c) => typeof c === 'string' && c.trim() !== '').length;
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  }
  const headerRow = aoa[best] ?? [];
  const width = Math.max(...aoa.slice(best, best + 200).map((r) => r ? r.length : 0), headerRow.length);
  const seen = new Map<string, number>();
  const headers: string[] = [];
  for (let c = 0; c < width; c++) {
    const raw = headerRow[c];
    let h = raw === null || raw === undefined || String(raw).trim() === '' ? `COLUMNA_${c + 1}` : String(raw).replace(/\s+/g, ' ').trim();
    const count = seen.get(h) ?? 0;
    seen.set(h, count + 1);
    if (count > 0) h = `${h}_${count + 1}`;
    headers.push(h);
  }
  const rows = aoa.
  slice(best + 1).
  filter((r) => Array.isArray(r) && r.some((c) => c !== null && String(c).trim() !== '')).
  map((r) => headers.map((_, c) => r[c] === undefined ? null : r[c]));
  const yearColumns = headers.
  map((h) => ({ header: h, year: Number(normalizeText(h)) })).
  filter((x) => Number.isInteger(x.year) && x.year >= 1990 && x.year <= 2100);
  return { name, headerRowIndex: best, headers, rows, empty: rows.length === 0, yearColumns };
}

/** Lee el libro sin ejecutar fórmulas ni macros (bookVBA desactivado). */
export function parseWorkbook(buf: ArrayBuffer, fileName: string, size: number): ParsedWorkbook {
  const format = detectSignature(buf);
  if (!format) throw new Error('El contenido no corresponde a un libro Excel (.xlsx o .xls).');
  const wb = XLSX.read(buf, { type: 'array', cellDates: false, cellFormula: false, cellHTML: false, bookVBA: false, cellStyles: false });
  if (!wb.SheetNames.length) throw new Error('El libro no contiene hojas.');
  const sheets = wb.SheetNames.map((n) => parseSheet(n, wb.Sheets[n]));
  return { fileName, size, format, sheets };
}

export function scoreHeader(header: string, synonym: string): number {
  const h = normalizeText(header);
  const s = normalizeText(synonym);
  if (!h || !s) return 0;
  if (h === s) return 100;
  const st = tokens(s);
  const ht = tokens(h);
  if (st.length === 1 && st[0].length <= 2) return 0;
  if (st.length > 0 && st.every((t) => ht.includes(t))) return 10 * st.length - (ht.length - st.length);
  return 0;
}

export function autoMap(kind: DatasetKind, headers: string[]): Record<string, string | null> {
  const fields = fieldSchemas[kind];
  const candidates: {field: string;header: string;score: number;}[] = [];
  for (const f of fields) {
    for (const h of headers) {
      if (isSensitive(h)) continue;
      const score = Math.max(...f.synonyms.map((s) => scoreHeader(h, s)));
      if (score > 0) candidates.push({ field: f.key, header: h, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const mapping: Record<string, string | null> = Object.fromEntries(fields.map((f) => [f.key, null]));
  const used = new Set<string>();
  for (const c of candidates) {
    if (mapping[c.field] !== null || used.has(c.header)) continue;
    mapping[c.field] = c.header;
    used.add(c.header);
  }
  return mapping;
}

export interface KindDetection {
  kind: DatasetKind;
  confidence: 'alta' | 'media' | 'baja';
  scores: Record<DatasetKind, number>;
}

export function detectKind(sheet: ParsedSheet, fileName: string): KindDetection {
  const fname = normalizeText(fileName);
  const scores = {} as Record<DatasetKind, number>;
  (Object.keys(fieldSchemas) as DatasetKind[]).forEach((k) => {
    const map = autoMap(k, sheet.headers);
    const fields = fieldSchemas[k];
    const matched = fields.filter((f) => map[f.key]).length;
    const requiredOk = fields.filter((f) => f.required).every((f) => map[f.key]);
    scores[k] = matched / fields.length + (requiredOk ? 0.3 : -0.5);
  });
  const has = (field: string, kind: DatasetKind) => !!autoMap(kind, sheet.headers)[field];
  if (has('lat', 'siniestros') && has('lon', 'siniestros')) scores.siniestros += 0.4;
  if (has('edad', 'personas') || has('tipoUsuario', 'personas')) scores.personas += 0.4;
  if (has('tipo', 'vehiculos')) scores.vehiculos += 0.3;
  if (sheet.yearColumns.length >= 3) scores.historico += 1;
  if (fname.includes('PERSONAS')) scores.personas += 0.5;
  if (fname.includes('VEHICULOS')) scores.vehiculos += 0.5;
  if (fname.includes('FATALES')) scores.siniestros += 0.5;
  if (fname.includes('POR ANO') || fname.includes('2008')) scores.historico += 0.5;
  const ranked = (Object.keys(scores) as DatasetKind[]).sort((a, b) => scores[b] - scores[a]);
  const gap = scores[ranked[0]] - scores[ranked[1]];
  const confidence = gap > 0.5 ? 'alta' : gap > 0.2 ? 'media' : 'baja';
  return { kind: ranked[0], confidence, scores };
}

export function sensitiveHeaders(headers: string[]): string[] {
  return headers.filter(isSensitive);
}