import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';
import type { ClusterParams, ConflictPolicy, EntityRecord, Filters, ImportLog, Intervention, IpivWeights, SiniestroView, StoreState } from '../types/data';
import { createEmptyState, STORE_KEY } from '../utils/store';
import { buildViews } from '../utils/metrics';
import { applyFilters, emptyFilters } from '../utils/filters';
import { runAnalysis } from '../utils/analysis';
import { commitImport, resolveConflict as resolveConflictFn } from '../utils/importCommit';
import type { CommitMeta } from '../utils/importCommit';
import type { ValidationResult } from '../utils/importValidation';

interface DataContextValue {
  state: StoreState;
  ready: boolean;
  loadError: string | null;
  views: SiniestroView[];
  filtered: SiniestroView[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  resetFilters: () => void;
  stale: boolean;
  staleReason: string | null;
  processing: boolean;
  commit: (vr: ValidationResult, meta: CommitMeta, policy: ConflictPolicy) => Promise<ImportLog>;
  appendLog: (log: ImportLog) => Promise<void>;
  reprocess: () => Promise<void>;
  saveSettings: (weights: IpivWeights, version: string, params: ClusterParams) => Promise<void>;
  resolveConflict: (id: string, apply: boolean) => Promise<void>;
  saveIntervention: (iv: Intervention) => Promise<void>;
  saveEntity: (rec: EntityRecord) => Promise<void>;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const persist = async (s: StoreState) => {
  await set(STORE_KEY, s);
};

export function DataProvider({ children }: {children: React.ReactNode;}) {
  const [state, setState] = useState<StoreState>(createEmptyState);
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    get<StoreState>(STORE_KEY).
    then((stored) => {
      if (stored) {
        const merged = { ...createEmptyState(), ...stored };
        stateRef.current = merged;
        setState(merged);
      }
    }).
    catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'No se pudo abrir el almacenamiento local.')).
    finally(() => setReady(true));
  }, []);

  const apply = useCallback(async (next: StoreState) => {
    await persist(next);
    stateRef.current = next;
    setState(next);
  }, []);

  const mutate = useCallback(async (fn: (s: StoreState) => StoreState, okMsg?: string) => {
    try {
      await apply(fn(stateRef.current));
      if (okMsg) toast.success(okMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar el cambio.');
      throw e;
    }
  }, [apply]);

  const commit = useCallback(async (vr: ValidationResult, meta: CommitMeta, policy: ConflictPolicy) => {
    const res = await commitImport(stateRef.current, vr, meta, policy, persist);
    stateRef.current = res.state;
    setState(res.state);
    return res.log;
  }, []);

  const appendLog = useCallback(async (log: ImportLog) => {
    await mutate((s) => ({ ...s, imports: [log, ...s.imports] }));
  }, [mutate]);

  const reprocess = useCallback(async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 30));
    try {
      const snapshot = runAnalysis(stateRef.current);
      await apply({ ...stateRef.current, analysis: snapshot });
      toast.success(`Análisis actualizado para la versión de datos v${snapshot.dataVersion}: ${snapshot.zones.length} concentraciones.`);
    } catch (e) {
      toast.error(`El reprocesamiento falló; se conserva el último resultado válido. ${e instanceof Error ? e.message : ''}`);
    } finally {
      setProcessing(false);
    }
  }, [apply]);

  const saveSettings = useCallback(async (weights: IpivWeights, version: string, params: ClusterParams) => {
    await mutate((s) => ({ ...s, weights, weightsVersion: version, clusterParams: params }), 'Parámetros guardados. Ejecute el reprocesamiento para aplicarlos.');
  }, [mutate]);

  const resolveConflict = useCallback(async (id: string, applyIncoming: boolean) => {
    await mutate((s) => resolveConflictFn(s, id, applyIncoming), applyIncoming ? 'Valor entrante aplicado.' : 'Se conserva el valor existente.');
  }, [mutate]);

  const saveIntervention = useCallback(async (iv: Intervention) => {
    await mutate((s) => ({ ...s, interventions: s.interventions.some((x) => x.id === iv.id) ? s.interventions.map((x) => x.id === iv.id ? iv : x) : [iv, ...s.interventions] }));
  }, [mutate]);

  const saveEntity = useCallback(async (rec: EntityRecord) => {
    await mutate((s) => ({ ...s, entities: { ...s.entities, [rec.zoneId]: rec } }), 'Entidad registrada.');
  }, [mutate]);

  const resetAll = useCallback(async () => {
    await mutate(() => createEmptyState(), 'Base local reiniciada.');
    setFilters(emptyFilters);
  }, [mutate]);

  const views = useMemo(() => buildViews(state, state.analysis), [state]);
  const filtered = useMemo(() => applyFilters(views, filters), [views, filters]);

  const a = state.analysis;
  let staleReason: string | null = null;
  if (a && a.dataVersion !== state.dataVersion) staleReason = `Los resultados de análisis corresponden a la versión v${a.dataVersion}; los datos están en v${state.dataVersion}.`;else
  if (a && (JSON.stringify(a.weights) !== JSON.stringify(state.weights) || JSON.stringify(a.params) !== JSON.stringify(state.clusterParams))) staleReason = 'Hay pesos o parámetros guardados que aún no se han aplicado al análisis.';else
  if (!a && state.siniestros.length) staleReason = 'Hay siniestros importados pero el análisis espacial aún no se ha ejecutado.';

  const value: DataContextValue = {
    state, ready, loadError, views, filtered, filters, setFilters,
    resetFilters: () => setFilters(emptyFilters),
    stale: staleReason !== null, staleReason, processing,
    commit, appendLog, reprocess, saveSettings, resolveConflict, saveIntervention, saveEntity, resetAll
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider');
  return ctx;
}