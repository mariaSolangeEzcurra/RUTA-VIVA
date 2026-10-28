import type { ClassShare, ClusterParams, CriterionKey, SiniestroView, Zone, ZoneCriterionValue } from '../types/data';
import { centroidOf, dbscan, haversine } from './geo';

export type RawZone = Omit<Zone, 'rank' | 'ipiv' | 'category'>;

const share = (num: number, den: number): number | null => den > 0 ? num / den : null;
const uniq = (arr: (string | null)[]) => Array.from(new Set(arr.filter((x): x is string => !!x)));

function emptyCriterion(detail: string): ZoneCriterionValue {
  return { raw: null, normalized: null, contribution: null, detail };
}

export function zoneStats(members: SiniestroView[], yearsInPeriod: number): RawZone {
  const pts = members.map((m) => ({ lat: m.lat as number, lon: m.lon as number }));
  const centroid = centroidOf(pts);
  const radiusM = Math.max(0, ...pts.map((p) => haversine(centroid[0], centroid[1], p.lat, p.lon)));
  const years = Array.from(new Set(members.map((m) => m.anio).filter((x): x is number => x !== null))).sort();
  const fKnown = members.filter((m) => m.fallecidos !== null);
  const lKnown = members.filter((m) => m.lesionados !== null);
  const fallecidos = fKnown.length ? fKnown.reduce((s, m) => s + (m.fallecidos ?? 0), 0) : null;
  const lesionados = lKnown.length ? lKnown.reduce((s, m) => s + (m.lesionados ?? 0), 0) : null;

  const withClass = members.filter((m) => m.clase);
  const classCounts = new Map<string, number>();
  withClass.forEach((m) => classCounts.set(m.clase as string, (classCounts.get(m.clase as string) ?? 0) + 1));
  const classShares: ClassShare[] = Array.from(classCounts.entries()).
  map(([label, count]) => ({ label, count, share: count / withClass.length })).
  sort((a, b) => b.count - a.count);
  const dominantClass = classShares[0] ?? null;

  const withHour = members.filter((m) => m.nocturno !== null);
  const nightShare = share(withHour.filter((m) => m.nocturno).length, withHour.length);
  const withVuln = members.filter((m) => m.vulnerable !== null);
  const vulnerableShare = share(withVuln.filter((m) => m.vulnerable).length, withVuln.length);
  const withMoto = members.filter((m) => m.moto !== null);
  const motoShare = share(withMoto.filter((m) => m.moto).length, withMoto.length);
  const withHeavy = members.filter((m) => m.pesado !== null);
  const heavyShare = share(withHeavy.filter((m) => m.pesado).length, withHeavy.length);

  const criteria: Record<CriterionKey, ZoneCriterionValue> = {
    consecuencias: fallecidos === null ?
    emptyCriterion('Sin conteo de fallecidos disponible en la zona.') :
    { raw: fallecidos, normalized: null, contribution: null, detail: `${fallecidos} fallecidos registrados (dato disponible en ${fKnown.length} de ${members.length} siniestros).` },
    recurrencia: { raw: years.length / Math.max(1, yearsInPeriod), normalized: null, contribution: null, detail: `Siniestros en ${years.length} de ${yearsInPeriod} años del periodo (${years.join(', ')}).` },
    concentracion: { raw: members.length, normalized: null, contribution: null, detail: `${members.length} siniestros fatales agrupados.` },
    vulnerables: vulnerableShare === null ?
    emptyCriterion('Sin personas ni vehículos vinculados para evaluar usuarios vulnerables.') :
    { raw: vulnerableShare, normalized: null, contribution: null, detail: `${withVuln.filter((m) => m.vulnerable).length} de ${withVuln.length} siniestros evaluables involucran usuarios vulnerables.` },
    temporal: nightShare === null ?
    emptyCriterion('Sin hora registrada en los siniestros de la zona.') :
    { raw: nightShare, normalized: null, contribution: null, detail: `${withHour.filter((m) => m.nocturno).length} de ${withHour.length} siniestros con hora ocurrieron entre 18:00 y 05:59.` },
    patronVial: dominantClass === null ?
    emptyCriterion('Sin clase de siniestro registrada.') :
    { raw: dominantClass.share, normalized: null, contribution: null, detail: `Clase más frecuente: ${dominantClass.label} (${dominantClass.count} de ${withClass.length}).` },
    entorno: emptyCriterion('No evaluado: no hay capa verificada de colegios u hospitales.'),
    exposicion: emptyCriterion('No evaluado: no hay datos de flujo vehicular vinculables a la zona.')
  };

  return {
    id: `ZA-${Math.abs(centroid[0]).toFixed(4)}S-${Math.abs(centroid[1]).toFixed(4)}W`,
    memberCodes: members.map((m) => m.codigo),
    centroid,
    radiusM,
    years,
    provincias: uniq(members.map((m) => m.provincia)),
    distritos: uniq(members.map((m) => m.distrito)),
    vias: uniq(members.map((m) => m.via)),
    redesViales: uniq(members.map((m) => m.redVial)),
    siniestros: members.length,
    fallecidos,
    fallecidosCobertura: members.length ? fKnown.length / members.length : 0,
    lesionados,
    lesionadosCobertura: members.length ? lKnown.length / members.length : 0,
    dominantClass,
    classShares,
    nightShare,
    hoursKnown: withHour.length,
    vulnerableShare,
    vulnerableKnown: withVuln.length,
    motoShare,
    heavyShare,
    criteria
  };
}

/** Agrupa los siniestros con coordenadas válidas mediante DBSCAN (haversine, metros). */
export function buildZones(views: SiniestroView[], params: ClusterParams, yearsInPeriod: number): {zones: RawZone[];noise: number;valid: SiniestroView[];} {
  const valid = views.filter((v) => v.coordStatus === 'valida' && v.lat !== null && v.lon !== null);
  const labels = dbscan(valid.map((v) => ({ id: v.codigo, lat: v.lat as number, lon: v.lon as number })), params.epsMeters, params.minPts);
  const groups = new Map<number, SiniestroView[]>();
  labels.forEach((l, i) => {
    if (l < 0) return;
    const arr = groups.get(l);
    if (arr) arr.push(valid[i]);else
    groups.set(l, [valid[i]]);
  });
  const zones = Array.from(groups.values()).map((m) => zoneStats(m, yearsInPeriod));
  return { zones, noise: labels.filter((l) => l < 0).length, valid };
}