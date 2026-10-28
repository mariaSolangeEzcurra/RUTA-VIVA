import type { StoreState } from '../types/data';
import { DEFAULT_WEIGHTS_VERSION, defaultClusterParams, defaultWeights } from '../data/ipivConfig';

export const STORE_KEY = 'ruta-viva-peru:store:v1';

export function createEmptyState(): StoreState {
  return {
    siniestros: [],
    personas: [],
    vehiculos: [],
    historico: [],
    imports: [],
    conflicts: [],
    dataVersion: 0,
    lastProcessedAt: null,
    analysis: null,
    weights: { ...defaultWeights },
    weightsVersion: DEFAULT_WEIGHTS_VERSION,
    clusterParams: { ...defaultClusterParams },
    interventions: [],
    entities: {}
  };
}