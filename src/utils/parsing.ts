import type { CoordStatus } from '../types/data';
import { NIGHT_END_HOUR, NIGHT_START_HOUR } from '../data/ipivConfig';

/** Envolvente rectangular aproximada de la región Arequipa (WGS84). No es el límite oficial. */
export const AREQUIPA_BBOX = { minLat: -17.45, maxLat: -14.55, minLon: -75.15, maxLon: -70.75 };
export const PERU_BBOX = { minLat: -18.4, maxLat: -0.03, minLon: -81.4, maxLon: -68.6 };

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return null;
  let s = String(value).trim().replace(/\s/g, '');
  if (s === '') return null;
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseIntValue(value: unknown): number | null {
  const n = parseNumber(value);
  if (n === null) return null;
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isRealDate(y: number, m: number, d: number): boolean {
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export interface ParseResult {
  value: string | null;
  error?: string;
}

/** Interpreta fechas en serie de Excel, dd/mm/aaaa o aaaa-mm-dd. Devuelve ISO aaaa-mm-dd. */
export function parseDate(value: unknown): ParseResult {
  if (value === null || value === undefined || String(value).trim() === '') return { value: null };
  if (typeof value === 'number') {
    if (value < 20000 || value > 80000) return { value: null, error: `Número de fecha fuera de rango (${value})` };
    const ms = Math.round((Math.floor(value) - 25569) * 86400000);
    const dt = new Date(ms);
    return { value: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}` };
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    if (!isRealDate(y, mo, d)) return { value: null, error: `Fecha inválida (${s})` };
    return { value: `${y}-${pad(mo)}-${pad(d)}` };
  }
  m = s.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!isRealDate(y, mo, d)) return { value: null, error: `Fecha inválida (${s})` };
    return { value: `${y}-${pad(mo)}-${pad(d)}` };
  }
  return { value: null, error: `Formato de fecha no reconocido (${s})` };
}

/** Interpreta horas como fracción de día, serie con hora, HH:MM, HH:MM AM/PM o HHMM. Devuelve HH:MM. */
export function parseTime(value: unknown): ParseResult {
  if (value === null || value === undefined || String(value).trim() === '') return { value: null };
  if (typeof value === 'number') {
    if (value >= 0 && value < 1) {
      const mins = Math.round(value * 1440) % 1440;
      return { value: `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}` };
    }
    if (Number.isInteger(value) && value >= 0 && value <= 23) return { value: `${pad(value)}:00` };
    if (value > 1 && !Number.isInteger(value)) {
      const frac = value - Math.floor(value);
      const mins = Math.round(frac * 1440) % 1440;
      return { value: `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}` };
    }
    return { value: null, error: `Hora fuera de rango (${value})` };
  }
  const s = String(value).trim().toUpperCase();
  let m = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|A\.M\.|P\.M\.)?/);
  if (m) {
    let h = Number(m[1]);
    const mi = Number(m[2]);
    const ampm = m[3];
    if (ampm) {
      const pm = ampm.startsWith('P');
      if (h === 12) h = pm ? 12 : 0;else
      if (pm) h += 12;
    }
    if (h > 23 || mi > 59) return { value: null, error: `Hora inválida (${s})` };
    return { value: `${pad(h)}:${pad(mi)}` };
  }
  m = s.match(/^(\d{2})(\d{2})$/);
  if (m) {
    const h = Number(m[1]);
    const mi = Number(m[2]);
    if (h > 23 || mi > 59) return { value: null, error: `Hora inválida (${s})` };
    return { value: `${pad(h)}:${pad(mi)}` };
  }
  return { value: null, error: `Formato de hora no reconocido (${s})` };
}

function inBox(lat: number, lon: number, b: typeof PERU_BBOX): boolean {
  return lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon;
}

/** Clasifica coordenadas sin corregirlas automáticamente. */
export function classifyCoord(latRaw: unknown, lonRaw: unknown): {lat: number | null;lon: number | null;status: CoordStatus;} {
  const hasLat = latRaw !== null && latRaw !== undefined && String(latRaw).trim() !== '';
  const hasLon = lonRaw !== null && lonRaw !== undefined && String(lonRaw).trim() !== '';
  if (!hasLat || !hasLon) return { lat: null, lon: null, status: 'faltante' };
  const lat = parseNumber(latRaw);
  const lon = parseNumber(lonRaw);
  if (lat === null || lon === null) return { lat: null, lon: null, status: 'no_numerica' };
  if (lat === 0 || lon === 0) return { lat, lon, status: 'cero' };
  if (inBox(lat, lon, PERU_BBOX)) {
    return { lat, lon, status: inBox(lat, lon, AREQUIPA_BBOX) ? 'valida' : 'fuera_region' };
  }
  if (inBox(lon, lat, PERU_BBOX)) return { lat, lon, status: 'invertida' };
  return { lat, lon, status: 'fuera_peru' };
}

export const coordStatusLabel: Record<CoordStatus, string> = {
  valida: 'Válida (dentro de la envolvente regional)',
  faltante: 'Faltante',
  no_numerica: 'No numérica',
  cero: 'Valor cero',
  fuera_peru: 'Fuera del Perú',
  fuera_region: 'Fuera de la envolvente de Arequipa',
  invertida: 'Latitud y longitud posiblemente invertidas'
};

export function hourOf(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const h = Number(hhmm.slice(0, 2));
  return Number.isFinite(h) ? h : null;
}

export const franjas = ['Madrugada (00:00–05:59)', 'Mañana (06:00–11:59)', 'Tarde (12:00–17:59)', 'Noche (18:00–23:59)'];

export function hourBand(hhmm: string | null): string | null {
  const h = hourOf(hhmm);
  if (h === null) return null;
  if (h < 6) return franjas[0];
  if (h < 12) return franjas[1];
  if (h < 18) return franjas[2];
  return franjas[3];
}

export function isNight(hhmm: string | null): boolean | null {
  const h = hourOf(hhmm);
  if (h === null) return null;
  return h >= NIGHT_START_HOUR || h <= NIGHT_END_HOUR;
}

export const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function weekdayOf(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.getUTCDay();
}