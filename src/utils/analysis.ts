import type { AnalysisSnapshot, StoreState } from '../types/data';
import { buildViews } from './metrics';
import { buildZones } from './zones';
import { scoreZones } from './ipiv';

/** Ejecuta el reprocesamiento espacial e IPIV sobre la versión actual de los datos. */
export function runAnalysis(state: StoreState): AnalysisSnapshot {
  const views = buildViews(state, null);
  const yearsAnalyzed = Array.from(new Set(views.map((v) => v.anio).filter((x): x is number => x !== null))).sort();
  const { zones, noise, valid } = buildZones(views, state.clusterParams, Math.max(1, yearsAnalyzed.length));
  return {
    dataVersion: state.dataVersion,
    ranAt: new Date().toISOString(),
    params: { ...state.clusterParams },
    weights: { ...state.weights },
    weightsVersion: state.weightsVersion,
    analyzedCount: views.length,
    validCoordCount: valid.length,
    noiseCount: noise,
    yearsAnalyzed,
    zones: scoreZones(zones, state.weights)
  };
}

export function isAnalysisStale(state: StoreState): boolean {
  return !!state.analysis && state.analysis.dataVersion !== state.dataVersion;
}