import type { Intervention, InterventionState, SiniestroView } from '../types/data';
import { haversine } from './geo';

export const stateLabel: Record<InterventionState, string> = {
  identificada: 'Identificada',
  pendiente_inspeccion: 'Pendiente de inspección',
  evaluada: 'Evaluada técnicamente',
  aprobada: 'Aprobada',
  en_ejecucion: 'En ejecución',
  ejecutada: 'Ejecutada',
  descartada: 'Descartada'
};

export const stateOrder: InterventionState[] = ['identificada', 'pendiente_inspeccion', 'evaluada', 'aprobada', 'en_ejecucion', 'ejecutada', 'descartada'];

export const allowedTransitions: Record<InterventionState, InterventionState[]> = {
  identificada: ['pendiente_inspeccion', 'descartada'],
  pendiente_inspeccion: ['evaluada', 'descartada'],
  evaluada: ['aprobada', 'pendiente_inspeccion', 'descartada'],
  aprobada: ['en_ejecucion', 'descartada'],
  en_ejecucion: ['ejecutada', 'descartada'],
  ejecutada: [],
  descartada: ['identificada']
};

/** Estados que exigen sustento documental del usuario; nunca los asigna el algoritmo. */
export const statesRequiringNote: InterventionState[] = ['evaluada', 'aprobada', 'ejecutada', 'descartada'];

export function transition(iv: Intervention, to: InterventionState, note: string, effectiveDate: string): Intervention {
  if (!allowedTransitions[iv.state].includes(to)) throw new Error(`Transición no permitida: ${stateLabel[iv.state]} → ${stateLabel[to]}.`);
  if (statesRequiringNote.includes(to) && !note.trim()) throw new Error(`El estado “${stateLabel[to]}” requiere una observación o sustento.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) throw new Error('Fecha efectiva inválida.');
  return {
    ...iv,
    state: to,
    executedOn: to === 'ejecutada' ? effectiveDate : iv.executedOn,
    history: [...iv.history, { at: new Date().toISOString(), effectiveDate, from: iv.state, to, note: note.trim() }]
  };
}

export interface BeforeAfter {
  status: 'ok' | 'insuficiente' | 'no_aplica';
  reason: string;
  windowDays: number;
  before: {from: string;to: string;siniestros: number;fallecidos: number | null;} | null;
  after: {from: string;to: string;siniestros: number;fallecidos: number | null;} | null;
}

const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Comparación descriptiva con ventanas simétricas. No atribuye causalidad. */
export function compareBeforeAfter(iv: Intervention, views: SiniestroView[]): BeforeAfter {
  if (!iv.executedOn) return { status: 'no_aplica', reason: 'La intervención no tiene fecha de ejecución registrada.', windowDays: 0, before: null, after: null };
  const dated = views.filter((v) => v.fecha);
  if (!dated.length) return { status: 'insuficiente', reason: 'No hay registros con fecha.', windowDays: 0, before: null, after: null };
  const times = dated.map((v) => Date.parse(`${v.fecha}T00:00:00Z`));
  const start = Math.min(...times);
  const end = Math.max(...times);
  const exec = Date.parse(`${iv.executedOn}T00:00:00Z`);
  const windowDays = Math.floor(Math.min(exec - start, end - exec, 730 * DAY) / DAY);
  if (windowDays < 180) {
    return { status: 'insuficiente', reason: `Se requieren al menos 180 días de datos antes y después de la ejecución; disponibles: ${Math.max(0, windowDays)} días.`, windowDays: Math.max(0, windowDays), before: null, after: null };
  }
  const radius = Math.max(iv.zoneRadiusM, 100);
  const inZone = dated.filter((v) => v.coordStatus === 'valida' && v.lat !== null && v.lon !== null && haversine(iv.zoneCentroid[0], iv.zoneCentroid[1], v.lat, v.lon) <= radius);
  const sum = (arr: SiniestroView[]) => {
    const known = arr.filter((v) => v.fallecidos !== null);
    return known.length ? known.reduce((s, v) => s + (v.fallecidos ?? 0), 0) : null;
  };
  const bFrom = exec - windowDays * DAY;
  const aTo = exec + windowDays * DAY;
  const b = inZone.filter((v) => {const t = Date.parse(`${v.fecha}T00:00:00Z`);return t >= bFrom && t < exec;});
  const a = inZone.filter((v) => {const t = Date.parse(`${v.fecha}T00:00:00Z`);return t > exec && t <= aTo;});
  return {
    status: 'ok',
    reason: 'Comparación descriptiva de siniestros fatales registrados. No controla tendencia regional, regresión a la media ni cambios de registro; no permite atribuir causalidad.',
    windowDays,
    before: { from: iso(bFrom), to: iso(exec - DAY), siniestros: b.length, fallecidos: sum(b) },
    after: { from: iso(exec + DAY), to: iso(aTo), siniestros: a.length, fallecidos: sum(a) }
  };
}