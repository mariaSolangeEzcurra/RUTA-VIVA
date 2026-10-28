const MISSING_TOKENS = new Set(['', '-', '--', 'NA', 'N A', 'N/A', 'NULL', 'NAN', 'S/D', 'SD', 'SIN DATO', 'SIN DATOS', 'NO DETERMINADO', 'NO REGISTRA', 'NONE', 'UNDEFINED']);

const STOPWORDS = new Set(['DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'N', 'NO', 'Y']);

/** Mayúsculas, sin tildes, con separadores normalizados a espacio. */
export function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).
  normalize('NFD').
  replace(/[\u0300-\u036f]/g, '').
  toUpperCase().
  replace(/[^A-Z0-9]+/g, ' ').
  trim();
}

export function tokens(value: string): string[] {
  return normalizeText(value).
  split(' ').
  filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/** Devuelve texto limpio o null si el valor representa un dato faltante. Nunca convierte faltantes en cero. */
export function cleanLabel(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/\s+/g, ' ').trim();
  if (MISSING_TOKENS.has(s.toUpperCase())) return null;
  return s.toUpperCase();
}

export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function formatInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return 'No disponible';
  return n.toLocaleString('es-PE');
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return 'No disponible';
  return `${(n * 100).toLocaleString('es-PE', { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Sin registro';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

export function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}