import type { ClusterParams, CriterionKey, IpivWeights, PriorityCategory } from '../types/data';

export interface CriterionDef {
  key: CriterionKey;
  label: string;
  definition: string;
  available: boolean;
}

export const criteriaDefs: CriterionDef[] = [
{ key: 'consecuencias', label: 'Consecuencias', definition: 'Fallecidos registrados en la zona (personas vinculadas o, en su defecto, conteo del registro del siniestro).', available: true },
{ key: 'recurrencia', label: 'Recurrencia', definition: 'Años distintos con siniestros en la zona ÷ años del periodo analizado.', available: true },
{ key: 'concentracion', label: 'Concentración', definition: 'Número de siniestros fatales agrupados en la zona.', available: true },
{ key: 'vulnerables', label: 'Usuarios vulnerables', definition: 'Proporción de siniestros con peatones, ciclistas, motociclistas, menores de 18 o mayores de 64 años, entre los que tienen información vinculada.', available: true },
{ key: 'temporal', label: 'Patrón temporal', definition: 'Proporción de siniestros nocturnos (18:00–05:59) entre los que tienen hora registrada.', available: true },
{ key: 'patronVial', label: 'Patrón vial', definition: 'Proporción de la clase de siniestro más frecuente (consistencia del mecanismo).', available: true },
{ key: 'entorno', label: 'Entorno sensible', definition: 'Proximidad a colegios u hospitales. Requiere capas geográficas verificables.', available: false },
{ key: 'exposicion', label: 'Exposición vehicular', definition: 'Flujo vehicular representativo del tramo. Requiere datos de aforo compatibles.', available: false }];


export const defaultWeights: IpivWeights = {
  consecuencias: 0.3,
  recurrencia: 0.2,
  concentracion: 0.2,
  vulnerables: 0.15,
  temporal: 0.075,
  patronVial: 0.075,
  entorno: 0,
  exposicion: 0
};

export const DEFAULT_WEIGHTS_VERSION = 'IPIV v0.1 – provisional (pesos no validados por AHP ni consenso experto)';

export const defaultClusterParams: ClusterParams = { epsMeters: 300, minPts: 3 };

export const categoryThresholds: {category: PriorityCategory;min: number;label: string;}[] = [
{ category: 'muy_alta', min: 75, label: 'Muy alta' },
{ category: 'alta', min: 50, label: 'Alta' },
{ category: 'media', min: 25, label: 'Media' },
{ category: 'baja', min: 0, label: 'Baja' }];


export const categoryLabel: Record<PriorityCategory, string> = {
  muy_alta: 'Muy alta',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja'
};

export const categoryHex: Record<PriorityCategory, string> = {
  muy_alta: '#9F1239',
  alta: '#EA580C',
  media: '#CA8A04',
  baja: '#64748B'
};

/** Franja nocturna usada por el criterio temporal. */
export const NIGHT_START_HOUR = 18;
export const NIGHT_END_HOUR = 5;