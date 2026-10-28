import React, { useEffect, useState } from 'react';
import { Loader2Icon, RotateCcwIcon } from 'lucide-react';
import type { ClusterParams, IpivWeights } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { criteriaDefs, DEFAULT_WEIGHTS_VERSION, defaultClusterParams, defaultWeights } from '../../data/ipivConfig';
import { normalizeWeights } from '../../utils/ipiv';
import { Button } from '../ui/Button';

export function WeightsEditor() {
  const { state, saveSettings, reprocess, processing } = useData();
  const [w, setW] = useState<IpivWeights>(state.weights);
  const [params, setParams] = useState<ClusterParams>(state.clusterParams);
  const [version, setVersion] = useState(state.weightsVersion);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setW(state.weights);
    setParams(state.clusterParams);
    setVersion(state.weightsVersion);
  }, [state.weights, state.clusterParams, state.weightsVersion]);

  const sum = criteriaDefs.filter((c) => c.available).reduce((s, c) => s + w[c.key], 0);

  const save = async () => {
    if (sum <= 0) {setError('Al menos un criterio debe tener peso mayor que cero.');return;}
    if (params.epsMeters < 25 || params.epsMeters > 5000) {setError('El radio ε debe estar entre 25 y 5 000 m.');return;}
    if (params.minPts < 2 || params.minPts > 50 || !Number.isInteger(params.minPts)) {setError('El mínimo de siniestros debe ser un entero entre 2 y 50.');return;}
    if (!version.trim()) {setError('Indique un nombre de versión para los pesos.');return;}
    setError(null);
    const normalized = normalizeWeights({ ...w, entorno: 0, exposicion: 0 });
    await saveSettings(normalized, version.trim(), params);
    await reprocess();
  };

  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted">Los pesos son provisionales. Modificarlos recalcula el ranking sin alterar los datos originales. Se normalizan para sumar 1.</p>
      <ul className="grid gap-3">
        {criteriaDefs.map((c) =>
        <li key={c.key}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor={`w-${c.key}`} className={c.available ? 'font-medium text-ink' : 'text-muted'}>{c.label}</label>
              <span className="tabular-nums text-muted">{c.available ? `${Math.round(w[c.key] / Math.max(sum, 1e-9) * 100)} %` : 'Sin capa'}</span>
            </div>
            <input id={`w-${c.key}`} type="range" min={0} max={0.5} step={0.005} value={c.available ? w[c.key] : 0} disabled={!c.available}
          onChange={(e) => setW({ ...w, [c.key]: Number(e.target.value) })} className="mt-1 w-full accent-[rgb(21,94,117)] disabled:opacity-40" />
          </li>
        )}
      </ul>
      <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <label htmlFor="eps" className="mb-1 block text-xs font-medium text-muted">Radio ε (metros)</label>
          <input id="eps" type="number" min={25} max={5000} value={params.epsMeters} onChange={(e) => setParams({ ...params, epsMeters: Number(e.target.value) })} className="h-9 w-full rounded-md border border-line px-2 text-sm" />
        </div>
        <div>
          <label htmlFor="minpts" className="mb-1 block text-xs font-medium text-muted">Mínimo de siniestros</label>
          <input id="minpts" type="number" min={2} max={50} value={params.minPts} onChange={(e) => setParams({ ...params, minPts: Number(e.target.value) })} className="h-9 w-full rounded-md border border-line px-2 text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="ver" className="mb-1 block text-xs font-medium text-muted">Versión de pesos</label>
        <input id="ver" value={version} onChange={(e) => setVersion(e.target.value)} className="h-9 w-full rounded-md border border-line px-2 text-sm" />
      </div>
      {error && <p role="alert" className="text-xs text-fatal">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save()} disabled={processing}>{processing && <Loader2Icon className="h-4 w-4 animate-spin" />}Guardar y recalcular</Button>
        <Button variant="ghost" onClick={() => {setW({ ...defaultWeights });setParams({ ...defaultClusterParams });setVersion(DEFAULT_WEIGHTS_VERSION);}}><RotateCcwIcon className="h-4 w-4" />Valores iniciales</Button>
      </div>
    </div>);

}