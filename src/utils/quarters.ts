import type { SiniestroView } from '../types/data';
import type { Coverage } from './temporal';
import { monthOf } from './temporal';
import { countBy } from './metrics';
import { titleCase } from './text';

/* ---------- Definiciones y paleta ---------- */

export type Quarter = 1 | 2 | 3 | 4;
export const QUARTERS: Quarter[] = [1, 2, 3, 4];

export const quarterInfo: Record<Quarter, { label: string; short: string; months: string; color: string; soft: string }> = {
  1: { label: 'Trimestre 1', short: 'T1', months: 'Ene – Mar', color: '#0891B2', soft: '#CFFAFE' },
  2: { label: 'Trimestre 2', short: 'T2', months: 'Abr – Jun', color: '#16A34A', soft: '#DCFCE7' },
  3: { label: 'Trimestre 3', short: 'T3', months: 'Jul – Sep', color: '#F59E0B', soft: '#FEF3C7' },
  4: { label: 'Trimestre 4', short: 'T4', months: 'Oct – Dic', color: '#C026D3', soft: '#FAE8FF' }
};

/** Colores vivos para puntos y zonas del mapa (semáforo: rojo = mayor prioridad). */
export const pointHex = {
  muy_alta: '#E11D48',
  alta: '#F97316',
  media: '#EAB308',
  baja: '#10B981',
  aislado: '#0EA5E9'
} as const;

/** Escala secuencial de calor (amarillo → rojo oscuro) para tablas y celdas. */
const HEAT_STOPS = ['#FFF7BC', '#FEC44F', '#FB8C29', '#E6402A', '#A50F15'];
const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function heatColor(t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (HEAT_STOPS.length - 1);
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const a = hexToRgb(HEAT_STOPS[i]);
  const b = hexToRgb(HEAT_STOPS[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
}
export const heatText = (t: number) => (t > 0.55 ? '#ffffff' : '#3b1d06');
export const HEAT_GRADIENT_CSS = `linear-gradient(90deg, ${HEAT_STOPS.join(', ')})`;

/** Gradiente de la capa de calor del mapa (azul → rojo). */
export const MAP_HEAT_GRADIENT: Record<number, string> = { 0.15: '#2563EB', 0.35: '#06B6D4', 0.55: '#84CC16', 0.75: '#FACC15', 0.9: '#F97316', 1: '#DC2626' };
export const MAP_HEAT_CSS = 'linear-gradient(90deg, #2563EB, #06B6D4, #84CC16, #FACC15, #F97316, #DC2626)';

export function quarterOf(iso: string | null): Quarter | null {
  const m = monthOf(iso);
  return m === null ? null : ((Math.floor(m / 3) + 1) as Quarter);
}

export const periodKey = (y: number, q: Quarter) => `${y}-T${q}`;
export const periodLabel = (y: number, q: Quarter) => `T${q} ${y}`;

/* ---------- Serie trimestral ---------- */

export interface QuarterPoint {
  key: string;
  year: number;
  q: Quarter;
  index: number;
  count: number;
  fallecidos: number;
  /** cobertura: completo (3 meses), parcial (1–2 meses) */
  status: 'completo' | 'parcial';
  monthsCovered: number;
}

export function quarterSeries(views: SiniestroView[], cov: Coverage): QuarterPoint[] {
  const years = Array.from(cov.keys()).sort((a, b) => a - b);
  const counts = new Map<string, { n: number; f: number }>();
  for (const v of views) {
    const q = quarterOf(v.fecha);
    if (q === null || v.anio === null) continue;
    const k = periodKey(v.anio, q);
    const c = counts.get(k) ?? { n: 0, f: 0 };
    c.n++;
    c.f += v.fallecidos ?? 0;
    counts.set(k, c);
  }
  const out: QuarterPoint[] = [];
  for (const y of years) {
    const c = cov.get(y);
    if (!c) continue;
    for (const q of QUARTERS) {
      const m0 = (q - 1) * 3;
      let covered = 0;
      for (let m = m0; m < m0 + 3; m++) if (m >= c.first && m <= c.last) covered++;
      if (!covered) continue;
      const k = periodKey(y, q);
      out.push({ key: k, year: y, q, index: y * 4 + (q - 1), count: counts.get(k)?.n ?? 0, fallecidos: counts.get(k)?.f ?? 0, status: covered === 3 ? 'completo' : 'parcial', monthsCovered: covered });
    }
  }
  return out;
}

/* ---------- Perfil por trimestre (todas las ediciones) ---------- */

export interface QuarterProfile {
  q: Quarter;
  total: number;
  yearsComplete: number;
  mean: number | null;
  share: number;
  index: number | null;
}

export function quarterProfile(series: QuarterPoint[]): QuarterProfile[] {
  const complete = series.filter((s) => s.status === 'completo');
  const grand = series.reduce((s, x) => s + x.count, 0);
  const means = QUARTERS.map((q) => {
    const c = complete.filter((s) => s.q === q);
    return c.length ? c.reduce((s, x) => s + x.count, 0) / c.length : null;
  });
  const known = means.filter((m): m is number => m !== null);
  const avg = known.length ? known.reduce((s, x) => s + x, 0) / known.length : 0;
  return QUARTERS.map((q, i) => {
    const total = series.filter((s) => s.q === q).reduce((s, x) => s + x.count, 0);
    return {
      q, total,
      yearsComplete: complete.filter((s) => s.q === q).length,
      mean: means[i],
      share: grand ? total / grand : 0,
      index: means[i] !== null && avg > 0 ? (means[i] as number) / avg : null
    };
  });
}

/* ---------- Proyección siguiente año (tendencia lineal × estacionalidad trimestral) ---------- */

function poissonQuantile(lambda: number, q: number): number {
  if (lambda <= 0) return 0;
  if (lambda > 200) return Math.max(0, Math.round(lambda + 1.2816 * Math.sqrt(lambda) * (q < 0.5 ? -1 : 1)));
  let k = 0;
  let p = Math.exp(-lambda);
  let c = p;
  while (c < q && k < 2000) { k++; p *= lambda / k; c += p; }
  return k;
}

export interface ProjectionPoint { key: string; year: number; q: Quarter; index: number; expected: number; low: number; high: number; }

export interface Projection {
  targetYear: number;
  points: ProjectionPoint[];
  /** solo los 4 trimestres del año objetivo */
  target: ProjectionPoint[];
  annual: { expected: number; low: number; high: number };
  lastFullYear: { year: number; count: number } | null;
  trendPerYear: number | null;
  seasonal: Record<Quarter, number>;
  usedQuarters: number;
  confidence: 'alta' | 'media' | 'baja' | 'insuficiente';
}

export function projectNextYear(series: QuarterPoint[]): Projection | null {
  const complete = series.filter((s) => s.status === 'completo');
  if (!series.length) return null;
  const lastYear = Math.max(...series.map((s) => s.year));
  const targetYear = lastYear + 1;
  const overall = complete.length ? complete.reduce((s, x) => s + x.count, 0) / complete.length : 0;
  const seasonal = {} as Record<Quarter, number>;
  QUARTERS.forEach((q) => {
    const c = complete.filter((s) => s.q === q);
    const m = c.length ? c.reduce((s, x) => s + x.count, 0) / c.length : overall;
    seasonal[q] = overall > 0 && c.length ? m / overall : 1;
  });
  if (complete.length < 4 || overall === 0) {
    return { targetYear, points: [], target: [], annual: { expected: 0, low: 0, high: 0 }, lastFullYear: null, trendPerYear: null, seasonal, usedQuarters: complete.length, confidence: 'insuficiente' };
  }
  // Regresión lineal sobre la serie desestacionalizada
  const xs = complete.map((s) => s.index);
  const ds = complete.map((s) => s.count / (seasonal[s.q] || 1));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const md = ds.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ds[i] - md); sxx += (x - mx) ** 2; });
  let b = n >= 6 && sxx > 0 ? sxy / sxx : 0;
  // amortiguar pendientes extremas (no más de ±25 % anual sobre la media)
  const cap = (0.25 * md) / 4;
  b = Math.max(-cap, Math.min(cap, b));
  const a = md - b * mx;
  const lastComplete = Math.max(...complete.map((s) => s.index));
  const points: ProjectionPoint[] = [];
  for (let idx = lastComplete + 1; idx <= targetYear * 4 + 3; idx++) {
    const y = Math.floor(idx / 4);
    const q = ((idx % 4) + 1) as Quarter;
    // Incluye trimestres parciales ya observados (se proyecta su valor completo esperado)
    const lam = Math.max(0, (a + b * idx) * seasonal[q]);
    points.push({ key: periodKey(y, q), year: y, q, index: idx, expected: lam, low: poissonQuantile(lam, 0.1), high: poissonQuantile(lam, 0.9) });
  }
  const target = points.filter((p) => p.year === targetYear);
  const annualLam = target.reduce((s, p) => s + p.expected, 0);
  const fullYears = Array.from(new Set(complete.map((s) => s.year))).filter((y) => complete.filter((s) => s.year === y).length === 4).sort((x, y) => y - x);
  const lfy = fullYears[0];
  const confidence = complete.length >= 12 && complete.reduce((s, x) => s + x.count, 0) >= 40 ? 'alta' : complete.length >= 8 ? 'media' : 'baja';
  return {
    targetYear, points, target,
    annual: { expected: annualLam, low: poissonQuantile(annualLam, 0.1), high: poissonQuantile(annualLam, 0.9) },
    lastFullYear: lfy !== undefined ? { year: lfy, count: complete.filter((s) => s.year === lfy).reduce((s, x) => s + x.count, 0) } : null,
    trendPerYear: md > 0 ? (b * 4) / md : null,
    seasonal, usedQuarters: n, confidence
  };
}

/* ---------- ¿Qué cambió entre dos periodos? ---------- */

export interface Driver { dimension: string; label: string; before: number; after: number; delta: number; }

const dimensions: { name: string; key: (v: SiniestroView) => string | null | string[] }[] = [
  { name: 'Provincia', key: (v) => v.provincia },
  { name: 'Distrito', key: (v) => v.distrito },
  { name: 'Tipo de siniestro', key: (v) => v.clase },
  { name: 'Causa registrada', key: (v) => v.causa },
  { name: 'Vehículo', key: (v) => v.tiposVehiculo },
  { name: 'Franja horaria', key: (v) => v.franja }
];

export function inPeriod(v: SiniestroView, y: number, q: Quarter) {
  return v.anio === y && quarterOf(v.fecha) === q;
}

export function explainChange(views: SiniestroView[], a: { year: number; q: Quarter }, b: { year: number; q: Quarter }) {
  const A = views.filter((v) => inPeriod(v, a.year, a.q));
  const B = views.filter((v) => inPeriod(v, b.year, b.q));
  const delta = B.length - A.length;
  const byDim = dimensions.map((d) => {
    const ca = new Map(countBy(A, d.key).map((x) => [x.label, x.value]));
    const cb = new Map(countBy(B, d.key).map((x) => [x.label, x.value]));
    const labels = new Set([...ca.keys(), ...cb.keys()]);
    const rows: Driver[] = Array.from(labels).map((l) => ({ dimension: d.name, label: l, before: ca.get(l) ?? 0, after: cb.get(l) ?? 0, delta: (cb.get(l) ?? 0) - (ca.get(l) ?? 0) }));
    rows.sort((x, y) => (delta <= 0 ? x.delta - y.delta : y.delta - x.delta));
    return { dimension: d.name, rows: rows.filter((r) => r.delta !== 0).slice(0, 5) };
  }).filter((d) => d.rows.length);
  // Factores principales: los que más empujan en la dirección del cambio (excluye distrito, que repite provincia)
  const main = byDim.filter((d) => d.dimension !== 'Distrito').flatMap((d) => d.rows.slice(0, 1)).filter((r) => (delta <= 0 ? r.delta < 0 : r.delta > 0)).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)).slice(0, 3);
  const sentence = delta === 0 ? 'No hubo variación en el número de siniestros.' :
    `${delta < 0 ? 'La caída' : 'El aumento'} de ${Math.abs(delta)} siniestro(s) se explica principalmente por ${main.length ? main.map((r) => `${r.delta < 0 ? 'menos' : 'más'} casos de «${titleCase(r.label)}» (${r.dimension.toLowerCase()}, ${r.delta > 0 ? '+' : ''}${r.delta})`).join('; ') : 'cambios repartidos sin un factor dominante'}.`;
  return { before: A.length, after: B.length, delta, pct: A.length ? delta / A.length : null, byDim, main, sentence };
}

/* ---------- Hallazgos automáticos ---------- */

export interface QuarterFinding { tone: 'up' | 'down' | 'info' | 'warn'; title: string; text: string; period?: { year: number; q: Quarter } }

export function quarterFindings(series: QuarterPoint[], profile: QuarterProfile[], proj: Projection | null): QuarterFinding[] {
  const out: QuarterFinding[] = [];
  const complete = series.filter((s) => s.status === 'completo');
  const top = [...profile].filter((p) => p.index !== null).sort((a, b) => (b.index ?? 0) - (a.index ?? 0))[0];
  const low = [...profile].filter((p) => p.index !== null).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
  if (top && top.index !== null && top.yearsComplete >= 2) {
    out.push({ tone: top.index >= 1.15 ? 'warn' : 'info', title: `${quarterInfo[top.q].short} es el trimestre más crítico`, text: `${quarterInfo[top.q].months}: promedio de ${top.mean?.toFixed(1)} siniestros por año, ${Math.round(((top.index) - 1) * 100)} % por encima del trimestre promedio.` });
  }
  if (low && top && low.q !== top.q && low.index !== null && low.yearsComplete >= 2) {
    out.push({ tone: 'info', title: `${quarterInfo[low.q].short} es el más tranquilo`, text: `${quarterInfo[low.q].months}: promedio de ${low.mean?.toFixed(1)} siniestros por año (${Math.round((1 - low.index) * 100)} % por debajo del promedio).` });
  }
  // Mayor caída y mayor subida interanual (mismo trimestre, año anterior)
  const yoy = complete.map((s) => {
    const prev = complete.find((p) => p.year === s.year - 1 && p.q === s.q);
    return prev ? { s, prev, d: s.count - prev.count } : null;
  }).filter((x): x is { s: QuarterPoint; prev: QuarterPoint; d: number } => !!x);
  const drop = [...yoy].sort((a, b) => a.d - b.d)[0];
  if (drop && drop.d < 0) out.push({ tone: 'down', title: `Mayor caída: ${periodLabel(drop.s.year, drop.s.q)}`, text: `Bajó de ${drop.prev.count} a ${drop.s.count} siniestros (${Math.round((drop.d / Math.max(1, drop.prev.count)) * 100)} %) frente al mismo trimestre de ${drop.prev.year}. Toque para ver por qué.`, period: { year: drop.s.year, q: drop.s.q } });
  const rise = [...yoy].sort((a, b) => b.d - a.d)[0];
  if (rise && rise.d > 0) out.push({ tone: 'up', title: `Mayor aumento: ${periodLabel(rise.s.year, rise.s.q)}`, text: `Subió de ${rise.prev.count} a ${rise.s.count} siniestros (+${Math.round((rise.d / Math.max(1, rise.prev.count)) * 100)} %) frente a ${rise.prev.year}. Toque para ver por qué.`, period: { year: rise.s.year, q: rise.s.q } });
  if (proj && proj.trendPerYear !== null && proj.confidence !== 'insuficiente') {
    const t = proj.trendPerYear;
    out.push({ tone: t < -0.02 ? 'down' : t > 0.02 ? 'up' : 'info', title: t < -0.02 ? 'Tendencia a la baja' : t > 0.02 ? 'Tendencia al alza' : 'Tendencia estable', text: `Descontando la estacionalidad, la serie ${t < -0.02 ? 'disminuye' : t > 0.02 ? 'aumenta' : 'varía'} en torno a ${Math.abs(Math.round(t * 100))} % por año.` });
  }
  const partial = series.filter((s) => s.status === 'parcial');
  if (partial.length) out.push({ tone: 'warn', title: 'Trimestres incompletos', text: `${partial.map((p) => periodLabel(p.year, p.q)).join(', ')} no tienen los 3 meses cargados: un valor bajo ahí no significa necesariamente una caída.` });
  return out;
}
