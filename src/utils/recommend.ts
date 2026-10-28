import type { Zone } from '../types/data';
import type { InterventionMeasure, PatternTrigger } from '../data/interventionCatalog';
import { interventionCatalog } from '../data/interventionCatalog';
import { normalizeText } from './text';

export interface Recommendation {
  measure: InterventionMeasure;
  evidence: string;
}

export function classShare(zone: Zone, keyword: string): {count: number;share: number;} {
  const total = zone.classShares.reduce((s, c) => s + c.count, 0);
  const count = zone.classShares.filter((c) => normalizeText(c.label).includes(keyword)).reduce((s, c) => s + c.count, 0);
  return { count, share: total ? count / total : 0 };
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

/** Reglas explícitas. Umbrales mínimos: al menos 2 siniestros del tipo y la proporción indicada. */
export function recommendForZone(zone: Zone): Recommendation[] {
  const out: {trigger: PatternTrigger;evidence: string;}[] = [];
  const atr = classShare(zone, 'ATROPELL');
  const fro = classShare(zone, 'FRONTAL');
  const cho = classShare(zone, 'CHOQUE');
  const des = classShare(zone, 'DESPISTE');
  const vol = classShare(zone, 'VOLCAD');

  if (atr.count >= 2 && atr.share >= 0.4) {
    if (zone.nightShare !== null && zone.hoursKnown >= 3 && zone.nightShare >= 0.5) {
      out.push({ trigger: 'atropello_nocturno', evidence: `${atr.count} atropellos (${pct(atr.share)} de los siniestros con clase) y ${pct(zone.nightShare)} de los siniestros con hora entre 18:00 y 05:59.` });
    } else {
      out.push({ trigger: 'atropello', evidence: `${atr.count} atropellos (${pct(atr.share)} de los siniestros con clase).` });
    }
  }
  if (fro.count >= 2 && fro.share >= 0.3) out.push({ trigger: 'choque_frontal', evidence: `${fro.count} siniestros registrados como frontales (${pct(fro.share)}).` });else
  if (cho.count >= 2 && cho.share >= 0.4) out.push({ trigger: 'choque', evidence: `${cho.count} choques (${pct(cho.share)} de los siniestros con clase).` });
  if (des.count >= 2 && des.share >= 0.4) out.push({ trigger: 'despiste', evidence: `${des.count} despistes (${pct(des.share)}).` });
  if (vol.count >= 2 && vol.share >= 0.3 && zone.heavyShare !== null && zone.heavyShare >= 0.5) {
    out.push({ trigger: 'volcadura_pesados', evidence: `${vol.count} volcaduras y ${pct(zone.heavyShare)} de siniestros con vehículos pesados vinculados.` });
  }
  if (zone.motoShare !== null && zone.vulnerableKnown >= 3 && zone.motoShare >= 0.4) {
    out.push({ trigger: 'motociclistas', evidence: `${pct(zone.motoShare)} de los siniestros evaluables involucran motocicletas o trimotos.` });
  }
  if (out.length === 0) out.push({ trigger: 'sin_patron', evidence: 'Ninguna regla alcanzó el umbral mínimo de evidencia.' });

  return out.
  map((o) => ({ measure: interventionCatalog.find((m) => m.trigger === o.trigger) as InterventionMeasure, evidence: o.evidence })).
  filter((r) => !!r.measure);
}