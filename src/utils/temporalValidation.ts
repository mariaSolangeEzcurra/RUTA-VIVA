import type { ClusterParams, CriterionKey, IpivWeights, SiniestroView, Zone } from '../types/data';
import { criteriaDefs } from '../data/ipivConfig';
import { nearAny } from './geo';
import { scoreZones } from './ipiv';
import { buildZones } from './zones';

export interface TopKResult {
  k: number;
  zonesAvailable: number;
  hits: number;
  total: number;
  share: number;
}

export interface StabilityResult {
  scenario: string;
  jaccardTop10: number;
}

export interface TemporalValidation {
  status: 'ejecutada' | 'no_ejecutable';
  reason: string;
  trainYears: number[];
  testYear: number;
  trainCount: number;
  testCount: number;
  zones: number;
  topK: TopKResult[];
  stability: StabilityResult[];
  executedAt: string;
}

const jaccard = (a: string[], b: string[]) => {
  const sa = new Set(a);
  const sb = new Set(b);
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 1;
};

/** Ranking construido solo con información ≤ 2024 y evaluado con los siniestros fatales de 2025. */
export function runTemporalValidation(views: SiniestroView[], params: ClusterParams, weights: IpivWeights, testYear = 2025): TemporalValidation {
  const base = { trainYears: [] as number[], testYear, trainCount: 0, testCount: 0, zones: 0, topK: [], stability: [], executedAt: new Date().toISOString() };
  const valid = views.filter((v) => v.coordStatus === 'valida' && v.anio !== null);
  const train = valid.filter((v) => v.anio as number < testYear && v.anio as number >= 2021);
  const test = valid.filter((v) => v.anio === testYear);
  const trainYears = Array.from(new Set(train.map((v) => v.anio as number))).sort();
  if (!train.length) return { ...base, status: 'no_ejecutable', reason: `No hay siniestros georreferenciados entre 2021 y ${testYear - 1}.` };
  if (!test.length) return { ...base, trainYears, trainCount: train.length, status: 'no_ejecutable', reason: `No hay siniestros georreferenciados de ${testYear} para evaluar.` };
  const { zones: raw } = buildZones(train, params, trainYears.length);
  const zones = scoreZones(raw, weights);
  if (!zones.length) return { ...base, trainYears, trainCount: train.length, testCount: test.length, status: 'no_ejecutable', reason: 'Con los parámetros actuales no se forman concentraciones en el periodo de construcción.' };

  const pointsOf = (zs: Zone[]) => {
    const codes = new Set(zs.flatMap((z) => z.memberCodes));
    return train.filter((v) => codes.has(v.codigo)).map((v) => ({ lat: v.lat as number, lon: v.lon as number }));
  };
  const topK = [10, 20].map((k) => {
    const pts = pointsOf(zones.slice(0, k));
    const hits = test.filter((t) => nearAny(t.lat as number, t.lon as number, pts, params.epsMeters)).length;
    return { k, zonesAvailable: Math.min(k, zones.length), hits, total: test.length, share: hits / test.length };
  });

  const baseTop = zones.slice(0, 10).map((z) => z.id);
  const keys = criteriaDefs.filter((c) => c.available && weights[c.key] > 0).map((c) => c.key);
  const stability: StabilityResult[] = [];
  for (const k of keys) {
    for (const f of [0.8, 1.2]) {
      const w = { ...weights, [k]: weights[k] * f } as Record<CriterionKey, number>;
      const alt = scoreZones(raw, w).slice(0, 10).map((z) => z.id);
      stability.push({ scenario: `${criteriaDefs.find((c) => c.key === k)?.label} ×${f}`, jaccardTop10: jaccard(baseTop, alt) });
    }
  }
  return {
    status: 'ejecutada',
    reason: 'Ranking construido exclusivamente con siniestros anteriores al año de evaluación.',
    trainYears, testYear, trainCount: train.length, testCount: test.length, zones: zones.length, topK, stability,
    executedAt: new Date().toISOString()
  };
}