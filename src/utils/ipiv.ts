import type { CriterionKey, IpivWeights, PriorityCategory, Zone } from '../types/data';
import { categoryThresholds, criteriaDefs } from '../data/ipivConfig';
import type { RawZone } from './zones';

export function categorize(score: number): PriorityCategory {
  return (categoryThresholds.find((t) => score >= t.min) ?? categoryThresholds[categoryThresholds.length - 1]).category;
}

/**
 * IPIV = 100 × Σ(wᵢ · xᵢ) / Σwᵢ, sobre los criterios con dato disponible para la zona.
 * xᵢ = normalización min–max entre todas las zonas analizadas. Si todas las zonas tienen el mismo valor,
 * el criterio no discrimina: xᵢ = 1 si el valor es mayor que 0, y 0 en caso contrario.
 */
export function scoreZones(raw: RawZone[], weights: IpivWeights): Zone[] {
  const keys = criteriaDefs.filter((c) => c.available && weights[c.key] > 0).map((c) => c.key);
  const ranges = {} as Record<CriterionKey, {min: number;max: number;} | null>;
  for (const k of keys) {
    const vals = raw.map((z) => z.criteria[k].raw).filter((v): v is number => v !== null);
    ranges[k] = vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null;
  }
  const scored = raw.map((z) => {
    const criteria = Object.fromEntries(Object.entries(z.criteria).map(([k, v]) => [k, { ...v, normalized: null, contribution: null }])) as Zone['criteria'];
    const avail = keys.filter((k) => z.criteria[k].raw !== null && ranges[k]);
    const sumW = avail.reduce((s, k) => s + weights[k], 0);
    let ipiv = 0;
    for (const k of avail) {
      const r = ranges[k] as {min: number;max: number;};
      const rawV = z.criteria[k].raw as number;
      const norm = r.max === r.min ? rawV > 0 ? 1 : 0 : (rawV - r.min) / (r.max - r.min);
      const contribution = sumW > 0 ? 100 * weights[k] * norm / sumW : 0;
      criteria[k] = { ...criteria[k], normalized: norm, contribution };
      ipiv += contribution;
    }
    return { ...z, criteria, ipiv: Math.round(ipiv * 10) / 10, category: categorize(ipiv), rank: 0 } as Zone;
  });
  scored.sort((a, b) => b.ipiv - a.ipiv || b.siniestros - a.siniestros || (b.fallecidos ?? 0) - (a.fallecidos ?? 0) || a.id.localeCompare(b.id));
  return scored.map((z, i) => ({ ...z, rank: i + 1 }));
}

export function topContributors(zone: Zone, n = 3): {key: CriterionKey;label: string;contribution: number;}[] {
  return criteriaDefs.
  map((c) => ({ key: c.key, label: c.label, contribution: zone.criteria[c.key].contribution ?? 0 })).
  filter((c) => c.contribution > 0).
  sort((a, b) => b.contribution - a.contribution).
  slice(0, n);
}

export function normalizeWeights(w: IpivWeights): IpivWeights {
  const sum = Object.values(w).reduce((s, v) => s + v, 0);
  if (sum <= 0) return w;
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / sum])) as IpivWeights;
}