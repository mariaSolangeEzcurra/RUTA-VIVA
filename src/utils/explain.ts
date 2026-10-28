import type { AnalysisSnapshot, Zone } from '../types/data';
import { categoryLabel } from '../data/ipivConfig';
import { topContributors } from './ipiv';
import { classShare } from './recommend';

export interface ZoneExplanation {
  pattern: string;
  patternReliable: boolean;
  evidence: string[];
  period: string;
  contributors: {label: string;contribution: number;}[];
  interpretation: string;
  pending: string[];
  nextStep: string;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

/** Explicación por plantillas y reglas a partir de resultados calculados; no usa texto inventado. */
export function explainZone(zone: Zone, snapshot: AnalysisSnapshot): ZoneExplanation {
  const evidence: string[] = [];
  let pattern = 'No es posible determinar un patrón dominante fiable con la evidencia disponible.';
  let reliable = false;
  const dc = zone.dominantClass;
  const withClass = zone.classShares.reduce((s, c) => s + c.count, 0);
  if (dc && dc.count >= 2 && dc.share >= 0.5) {
    pattern = `Predominio de siniestros clasificados como “${dc.label}”.`;
    reliable = true;
  } else if (dc && dc.count >= 2 && dc.share >= 0.35) {
    pattern = `Mayor frecuencia relativa de “${dc.label}”, sin predominio claro.`;
  }
  if (dc) evidence.push(`${dc.count} de ${withClass} siniestros con clase registrada son “${dc.label}” (${pct(dc.share)}).`);
  if (zone.nightShare !== null && zone.hoursKnown >= 3 && zone.nightShare >= 0.6) {
    evidence.push(`${pct(zone.nightShare)} de los ${zone.hoursKnown} siniestros con hora ocurrieron en horario nocturno (18:00–05:59).`);
    if (reliable) pattern = pattern.replace(/\.$/, ', con concentración nocturna.');
  }
  if (zone.vulnerableShare !== null && zone.vulnerableKnown >= 3 && zone.vulnerableShare >= 0.5) {
    evidence.push(`${pct(zone.vulnerableShare)} de los ${zone.vulnerableKnown} siniestros evaluables involucran usuarios vulnerables.`);
  }
  const atr = classShare(zone, 'ATROPELL');
  if (atr.count >= 2 && dc && !dc.label.includes('ATROPELL')) evidence.push(`${atr.count} atropellos registrados en la zona.`);
  evidence.push(`${zone.siniestros} siniestros fatales en ${zone.years.length} año(s) distintos; radio de la concentración ${Math.round(zone.radiusM)} m.`);
  if (zone.fallecidos !== null) evidence.push(`${zone.fallecidos} fallecidos registrados (dato disponible para ${pct(zone.fallecidosCobertura)} de los siniestros).`);

  const contributors = topContributors(zone, 3).map((c) => ({ label: c.label, contribution: Math.round(c.contribution * 10) / 10 }));
  const lead = contributors[0];
  const interpretation = lead ?
  `La zona ocupa el puesto ${zone.rank} (prioridad ${categoryLabel[zone.category].toLowerCase()}, IPIV ${zone.ipiv}). El criterio que más aporta es “${lead.label}” (${lead.contribution} puntos). La puntuación expresa carga histórica de siniestros registrados, no probabilidad de accidente: no se dispone de datos de exposición vehicular.` :
  `La zona ocupa el puesto ${zone.rank} sin criterios con aporte positivo.`;

  const pending: string[] = [];
  if (zone.redesViales.length === 0) pending.push('Clasificación y titularidad de la vía.');
  pending.push('Correspondencia con un tramo de la red vial oficial (no hay capa SINAC cargada).');
  if (zone.vias.length === 0) pending.push('Código de ruta y progresiva.');
  if (zone.hoursKnown < zone.siniestros) pending.push(`Hora del siniestro en ${zone.siniestros - zone.hoursKnown} registros.`);
  if (zone.vulnerableKnown < zone.siniestros) pending.push(`Personas o vehículos vinculados en ${zone.siniestros - zone.vulnerableKnown} registros.`);
  if (zone.fallecidosCobertura < 1) pending.push('Conteo de fallecidos en parte de los registros.');
  pending.push('Entorno sensible (colegios, hospitales) y exposición vehicular.');

  return {
    pattern,
    patternReliable: reliable,
    evidence,
    period: snapshot.yearsAnalyzed.length ? `${snapshot.yearsAnalyzed[0]}–${snapshot.yearsAnalyzed[snapshot.yearsAnalyzed.length - 1]}` : 'Sin periodo',
    contributors,
    interpretation,
    pending,
    nextStep: reliable ?
    'Programar una inspección de seguridad vial en campo para verificar el mecanismo identificado y evaluar las intervenciones candidatas.' :
    'Programar una inspección de seguridad vial general y revisar los expedientes de los siniestros antes de proponer medidas.'
  };
}