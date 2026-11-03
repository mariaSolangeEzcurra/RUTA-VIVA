import type { SiniestroView } from '../types/data';
import { countBy } from './metrics';
import { weekdayOf } from './parsing';
import { normalizeText, titleCase } from './text';

export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY = 86400000;

export function monthOf(iso: string | null): number | null {
  if (!iso) return null;
  const m = Number(iso.slice(5, 7));
  return m >= 1 && m <= 12 ? m - 1 : null;
}

/* ---------- Feriados (solo fechas nacionales de larga vigencia + Semana Santa calculada) ---------- */

function easterSunday(y: number): number {
  const a = y % 19,b = Math.floor(y / 100),c = y % 100,d = Math.floor(b / 4),e = b % 4;
  const f = Math.floor((b + 8) / 25),g = Math.floor((b - f + 1) / 3),h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4),k = c % 4,l = (32 + 2 * e + 2 * i - h - k) % 7,m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = (h + l - 7 * m + 114) % 31 + 1;
  return Date.UTC(y, month - 1, day);
}

export interface Holiday {date: string;name: string;}
const holidayCache = new Map<number, Holiday[]>();

export function peruHolidays(year: number): Holiday[] {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const fixed: [string, string][] = [
  ['01-01', 'Año Nuevo'], ['05-01', 'Día del Trabajo'], ['06-29', 'San Pedro y San Pablo'], ['07-28', 'Fiestas Patrias'], ['07-29', 'Fiestas Patrias'],
  ['08-15', 'Aniversario de Arequipa (celebración local)'], ['08-30', 'Santa Rosa de Lima'], ['10-08', 'Combate de Angamos'], ['11-01', 'Todos los Santos'],
  ['12-08', 'Inmaculada Concepción'], ['12-25', 'Navidad']];

  const easter = easterSunday(year);
  const list: Holiday[] = [
  ...fixed.map(([md, name]) => ({ date: `${year}-${md}`, name })),
  { date: iso(easter - 3 * DAY), name: 'Jueves Santo' },
  { date: iso(easter - 2 * DAY), name: 'Viernes Santo' }];

  holidayCache.set(year, list);
  return list;
}

/** Devuelve el feriado a ±windowDays días de la fecha, si existe. */
export function holidayNear(isoDate: string | null, windowDays = 1): string | null {
  if (!isoDate) return null;
  const y = Number(isoDate.slice(0, 4));
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(t)) return null;
  let best: {name: string;dist: number;} | null = null;
  for (const yy of [y - 1, y, y + 1]) {
    for (const h of peruHolidays(yy)) {
      const dist = Math.abs(t - Date.parse(`${h.date}T00:00:00Z`));
      if (dist <= windowDays * DAY && (!best || dist < best.dist)) best = { name: h.name, dist };
    }
  }
  return best?.name ?? null;
}

/* ---------- Cobertura temporal del conjunto de datos ---------- */

/** Año → primer y último mes con registros en toda la base (evita contar meses sin cobertura como ceros). */
export type Coverage = Map<number, {first: number;last: number;}>;

export function datasetCoverage(views: SiniestroView[]): Coverage {
  const cov: Coverage = new Map();
  for (const v of views) {
    const m = monthOf(v.fecha);
    if (m === null || v.anio === null) continue;
    const c = cov.get(v.anio);
    if (!c) cov.set(v.anio, { first: m, last: m });else
    cov.set(v.anio, { first: Math.min(c.first, m), last: Math.max(c.last, m) });
  }
  return cov;
}

export function yearsCovering(cov: Coverage, month: number): number[] {
  return Array.from(cov.entries()).filter(([, c]) => c.first <= month && c.last >= month).map(([y]) => y).sort((a, b) => a - b);
}

/* ---------- Perfil mensual ---------- */

export interface MonthStat {
  month: number;
  total: number;
  byYear: {year: number;count: number;}[];
  yearsObserved: number;
  yearsWith: number;
  mean: number | null;
  index: number | null;
  fallecidos: number | null;
}

export function monthlyProfile(views: SiniestroView[], cov: Coverage): MonthStat[] {
  const stats: MonthStat[] = MONTHS.map((_, m) => {
    const years = yearsCovering(cov, m);
    const inMonth = views.filter((v) => monthOf(v.fecha) === m);
    const byYear = years.map((y) => ({ year: y, count: inMonth.filter((v) => v.anio === y).length }));
    const fKnown = inMonth.filter((v) => v.fallecidos !== null);
    return {
      month: m,
      total: inMonth.length,
      byYear,
      yearsObserved: years.length,
      yearsWith: byYear.filter((b) => b.count > 0).length,
      mean: years.length ? inMonth.length / years.length : null,
      index: null,
      fallecidos: fKnown.length ? fKnown.reduce((s, v) => s + (v.fallecidos ?? 0), 0) : null
    };
  });
  const means = stats.map((s) => s.mean).filter((x): x is number => x !== null);
  const avg = means.length ? means.reduce((s, x) => s + x, 0) / means.length : 0;
  return stats.map((s) => ({ ...s, index: s.mean !== null && avg > 0 ? s.mean / avg : null }));
}

/* ---------- Ventanas de fechas recurrentes entre años ---------- */

export interface DateWindow {
  month: number;
  startDay: number;
  endDay: number;
  years: number[];
  events: SiniestroView[];
}

const doy = (iso: string) => Math.floor((Date.UTC(2001, Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) - Date.UTC(2001, 0, 1)) / DAY);

/** Agrupa siniestros que ocurren en la misma ventana del calendario (≤ windowDays días) en años distintos. */
export function recurringWindows(views: SiniestroView[], windowDays = 7): DateWindow[] {
  const dated = views.filter((v) => v.fecha && v.anio !== null).map((v) => ({ v, d: doy(v.fecha as string) })).sort((a, b) => a.d - b.d);
  const used = new Set<string>();
  const out: DateWindow[] = [];
  const candidates = dated.map((start) => {
    const group = dated.filter((x) => x.d >= start.d && x.d < start.d + windowDays);
    return { start, group, years: Array.from(new Set(group.map((x) => x.v.anio as number))).sort() };
  }).filter((c) => c.years.length >= 2).sort((a, b) => b.years.length - a.years.length || b.group.length - a.group.length);
  for (const c of candidates) {
    const fresh = c.group.filter((x) => !used.has(x.v.codigo));
    const years = Array.from(new Set(fresh.map((x) => x.v.anio as number))).sort();
    if (years.length < 2) continue;
    fresh.forEach((x) => used.add(x.v.codigo));
    const first = fresh[0].v.fecha as string;
    const last = fresh[fresh.length - 1].v.fecha as string;
    out.push({ month: Number(first.slice(5, 7)) - 1, startDay: Number(first.slice(8, 10)), endDay: Number(last.slice(8, 10)), years, events: fresh.map((x) => x.v) });
  }
  return out.slice(0, 5);
}

/* ---------- Análisis temporal de un conjunto (zona o región) ---------- */

export interface TemporalProfile {
  total: number;
  months: MonthStat[];
  peak: MonthStat | null;
  seasonal: boolean;
  windows: DateWindow[];
  weekendShare: number | null;
  weekendKnown: number;
  nightShare: number | null;
  hoursKnown: number;
  holidayEvents: {item: SiniestroView;holiday: string;}[];
}

export function analyzeTemporal(views: SiniestroView[], cov: Coverage): TemporalProfile {
  const months = monthlyProfile(views, cov);
  const peak = [...months].sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0) || b.total - a.total || (b.fallecidos ?? 0) - (a.fallecidos ?? 0))[0] ?? null;
  const dated = views.filter((v) => v.fecha);
  const weekend = dated.filter((v) => {const w = weekdayOf(v.fecha);return w === 0 || w === 6;}).length;
  const withHour = views.filter((v) => v.nocturno !== null);
  return {
    total: views.length,
    months,
    peak: peak && peak.total > 0 ? peak : null,
    seasonal: !!peak && peak.total >= 2 && peak.yearsWith >= 2 && (peak.index ?? 0) >= 1.5,
    windows: recurringWindows(views),
    weekendShare: dated.length ? weekend / dated.length : null,
    weekendKnown: dated.length,
    nightShare: withHour.length ? withHour.filter((v) => v.nocturno).length / withHour.length : null,
    hoursKnown: withHour.length,
    holidayEvents: dated.map((v) => ({ item: v, holiday: holidayNear(v.fecha) })).filter((x): x is {item: SiniestroView;holiday: string;} => x.holiday !== null)
  };
}

export function monthEvents(views: SiniestroView[], month: number): SiniestroView[] {
  return views.filter((v) => monthOf(v.fecha) === month).sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? '') || (a.hora ?? '').localeCompare(b.hora ?? ''));
}

/* ---------- Proyección por mes (expectativa histórica de Poisson) ---------- */

export interface Forecast {
  month: number;
  lambda: number | null;
  low: number | null;
  high: number | null;
  pAtLeastOne: number | null;
  yearsUsed: number;
  total: number;
  confidence: 'alta' | 'media' | 'baja' | 'insuficiente';
}

function poissonQuantile(lambda: number, q: number): number {
  let k = 0;
  let p = Math.exp(-lambda);
  let c = p;
  while (c < q && k < 1000) {
    k++;
    p *= lambda / k;
    c += p;
  }
  return k;
}

/**
 * Supone que el número de siniestros del mes sigue un Poisson con media igual al promedio histórico del mes.
 * Es una expectativa basada en el pasado, no una predicción causal.
 */
export function forecastMonth(stat: MonthStat): Forecast {
  if (!stat.yearsObserved || stat.mean === null) {
    return { month: stat.month, lambda: null, low: null, high: null, pAtLeastOne: null, yearsUsed: 0, total: stat.total, confidence: 'insuficiente' };
  }
  const lambda = stat.mean;
  const confidence = stat.yearsObserved >= 4 && stat.total >= 5 ? 'alta' : stat.yearsObserved >= 3 && stat.total >= 2 ? 'media' : 'baja';
  return {
    month: stat.month, lambda,
    low: poissonQuantile(lambda, 0.1), high: poissonQuantile(lambda, 0.9),
    pAtLeastOne: 1 - Math.exp(-lambda),
    yearsUsed: stat.yearsObserved, total: stat.total, confidence
  };
}

/* ---------- Motor de interpretación (reglas explícitas) ---------- */

export type InsightKind = 'hallazgo' | 'prediccion' | 'causa' | 'recomendacion' | 'limitacion';

export interface Insight {
  kind: InsightKind;
  title: string;
  text: string;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;
const classMeasure: [string, string][] = [
['ATROPELL', 'cruces peatonales, iluminación y gestión de velocidad'],
['DESPISTE', 'delineación, señalización de curva y barreras'],
['VOLCAD', 'gestión de velocidad y advertencia de curvas y pendientes'],
['FRONTAL', 'separación de sentidos y control de adelantamientos'],
['CHOQUE', 'visibilidad, señalización de prioridad y control en intersecciones']];


export function temporalInsights(t: TemporalProfile, views: SiniestroView[], month: number): Insight[] {
  const out: Insight[] = [];
  const mName = MONTHS[month];
  const stat = t.months[month];
  const events = monthEvents(views, month);

  if (t.total < 3) {
    out.push({ kind: 'limitacion', title: 'Evidencia limitada', text: `Solo hay ${t.total} siniestro(s) en el conjunto: los patrones temporales no son fiables.` });
  }

  // Hallazgos
  if (t.peak) {
    out.push(t.seasonal ?
    { kind: 'hallazgo', title: `Estacionalidad en ${MONTHS[t.peak.month].toLowerCase()}`, text: `${MONTHS[t.peak.month]} concentra ${t.peak.total} siniestros en ${t.peak.yearsWith} de ${t.peak.yearsObserved} años, ${t.peak.index?.toFixed(1)} veces el promedio mensual.` } :
    { kind: 'hallazgo', title: 'Sin estacionalidad clara', text: `El mes con más registros es ${MONTHS[t.peak.month].toLowerCase()} (${t.peak.total}), pero no supera 1,5 veces el promedio mensual en al menos dos años.` });
  }
  t.windows.slice(0, 2).forEach((w) => {
    out.push({ kind: 'hallazgo', title: `Fechas que se repiten: ${w.startDay}–${w.endDay} de ${MONTHS[w.month].toLowerCase()}`, text: `${w.events.length} siniestros en esa ventana del calendario en ${w.years.length} años distintos (${w.years.join(', ')}).` });
  });
  if (t.holidayEvents.length >= 2) {
    const names = Array.from(new Set(t.holidayEvents.map((h) => h.holiday)));
    out.push({ kind: 'hallazgo', title: 'Coincidencia con feriados', text: `${t.holidayEvents.length} siniestros ocurrieron a ±1 día de un feriado (${names.slice(0, 4).join(', ')}).` });
  }
  if (t.weekendShare !== null && t.weekendKnown >= 4 && t.weekendShare >= 0.5) {
    out.push({ kind: 'hallazgo', title: 'Predominio de fin de semana', text: `${pct(t.weekendShare)} de los siniestros con fecha ocurrieron en sábado o domingo (esperado sin patrón: 29 %).` });
  }

  // Lo ocurrido en el mes seleccionado y posibles causas registradas
  if (events.length) {
    const causas = countBy(events, (v) => v.causa);
    const clases = countBy(events, (v) => v.clase);
    const withCausa = events.filter((v) => v.causa).length;
    const restCausa = views.filter((v) => monthOf(v.fecha) !== month && v.causa);
    if (causas[0]) {
      const restShare = restCausa.length ? restCausa.filter((v) => v.causa === causas[0].label).length / restCausa.length : null;
      out.push({ kind: 'causa', title: `Causa registrada más frecuente en ${mName.toLowerCase()}`, text: `${titleCase(causas[0].label)}: ${causas[0].value} de ${withCausa} siniestros con causa${restShare !== null ? ` (${pct(causas[0].value / withCausa)} frente a ${pct(restShare)} en el resto del año)` : ''}. Es la causa anotada en el registro, no una causa verificada.` });
    } else {
      out.push({ kind: 'causa', title: 'Causa no disponible', text: `Los siniestros de ${mName.toLowerCase()} no tienen causa registrada.` });
    }
    if (clases[0]) out.push({ kind: 'causa', title: 'Mecanismo más frecuente en el mes', text: `${titleCase(clases[0].label)} (${clases[0].value} de ${events.filter((v) => v.clase).length} con clase registrada).` });
    const nightM = events.filter((v) => v.nocturno !== null);
    if (nightM.length >= 2 && nightM.filter((v) => v.nocturno).length / nightM.length >= 0.5) {
      out.push({ kind: 'causa', title: 'Factor horario', text: `${nightM.filter((v) => v.nocturno).length} de ${nightM.length} siniestros con hora en ${mName.toLowerCase()} ocurrieron entre 18:00 y 05:59.` });
    }
  } else if (stat.yearsObserved) {
    out.push({ kind: 'causa', title: `Sin registros en ${mName.toLowerCase()}`, text: `No hubo siniestros en ${mName.toLowerCase()} en los ${stat.yearsObserved} años con cobertura.` });
  }

  // Proyección
  const f = forecastMonth(stat);
  if (f.lambda !== null) {
    out.push({ kind: 'prediccion', title: `Expectativa para ${mName.toLowerCase()}`, text: `Promedio histórico de ${f.lambda.toFixed(2)} siniestros fatales (rango probable ${f.low}–${f.high}); probabilidad histórica de al menos uno: ${pct(f.pAtLeastOne ?? 0)}. Basado en ${f.yearsUsed} años; confianza ${f.confidence}. Supone que las condiciones se mantienen.` });
  }

  // Recomendaciones temporales
  if (t.seasonal && t.peak) {
    out.push({ kind: 'recomendacion', title: `Anticipar ${MONTHS[t.peak.month].toLowerCase()}`, text: `Programar la inspección técnica y los operativos de control en las 2–4 semanas previas a ${MONTHS[t.peak.month].toLowerCase()}.` });
  }
  const w0 = t.windows[0];
  if (w0) out.push({ kind: 'recomendacion', title: 'Ventana de fiscalización focalizada', text: `Reforzar el control entre el ${w0.startDay} y el ${w0.endDay} de ${MONTHS[w0.month].toLowerCase()}, ventana con siniestros repetidos en ${w0.years.join(', ')}.` });
  if (t.holidayEvents.length >= 2) out.push({ kind: 'recomendacion', title: 'Feriados', text: 'Campañas preventivas y control de velocidad y alcohol en los días previos a los feriados asociados.' });
  if (t.weekendShare !== null && t.weekendKnown >= 4 && t.weekendShare >= 0.5) out.push({ kind: 'recomendacion', title: 'Fines de semana', text: 'Concentrar operativos de control en sábados y domingos.' });
  if (events.length) {
    const dom = countBy(events, (v) => v.clase)[0];
    const rule = dom ? classMeasure.find(([k]) => normalizeText(dom.label).includes(k)) : undefined;
    if (rule && dom.value >= 2) out.push({ kind: 'recomendacion', title: `Medida a evaluar antes de ${mName.toLowerCase()}`, text: `Por el predominio de ${titleCase(dom.label).toLowerCase()}, evaluar ${rule[1]}.` });
  }
  if (t.peak && t.seasonal && t.peak.month <= 2) {
    out.push({ kind: 'limitacion', title: 'Hipótesis por verificar: temporada de lluvias', text: 'El pico coincide con la temporada de lluvias en la sierra sur. No hay datos de SENAMHI cargados: es una hipótesis, no un hallazgo.' });
  }
  return out;
}