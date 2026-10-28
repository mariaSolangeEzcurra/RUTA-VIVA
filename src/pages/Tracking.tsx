import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { InterventionEditor } from '../components/tracking/InterventionEditor';
import { stateLabel, stateOrder } from '../utils/interventions';
import type { InterventionState } from '../types/data';

export function Tracking() {
  const { state } = useData();
  const [selected, setSelected] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<InterventionState | 'todos'>('todos');
  const list = state.interventions.filter((i) => stateFilter === 'todos' || i.state === stateFilter);
  const current = state.interventions.find((i) => i.id === selected) ?? list[0] ?? null;
  const counts = stateOrder.map((s) => ({ s, n: state.interventions.filter((i) => i.state === s).length }));

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <PageHeader title="Seguimiento de intervenciones" description="Ciclo de vida de cada intervención candidata. Los cambios de estado los registra un usuario con sustento; el algoritmo nunca aprueba ni ejecuta medidas." />
      {state.interventions.length === 0 ?
      <div className="mt-6"><EmptyState title="Sin intervenciones registradas" description="Abra una zona del ranking IPIV y use “Registrar en seguimiento” en una intervención candidata." actionLabel="Ir al ranking IPIV" actionTo="/ranking" /></div> :

      <>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
            <button type="button" onClick={() => setStateFilter('todos')} className={`rounded-full border px-3 py-1 text-xs ${stateFilter === 'todos' ? 'border-navy bg-navy text-white' : 'border-line bg-surface'}`}>Todos ({state.interventions.length})</button>
            {counts.map(({ s, n }) =>
          <button key={s} type="button" disabled={!n} onClick={() => setStateFilter(s)} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs disabled:opacity-40 ${stateFilter === s ? 'border-navy bg-navy text-white' : 'border-line bg-surface'}`}>{stateLabel[s]} ({n})</button>
          )}
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[360px_1fr]">
            <ul className="grid content-start divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {list.map((i) =>
            <li key={i.id}>
                  <button type="button" onClick={() => setSelected(i.id)} className={`block w-full px-4 py-3 text-left transition-colors duration-150 ease-out ${current?.id === i.id ? 'bg-primary-soft' : 'hover:bg-canvas'}`}>
                    <p className="flex items-center justify-between gap-2 text-xs"><span className="font-mono text-muted">{i.measureId}</span><span className="whitespace-nowrap font-semibold">{stateLabel[i.state]}</span></p>
                    <p className="mt-1 line-clamp-2 text-sm text-ink">{i.measureLabel}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{i.zoneLabel}</p>
                  </button>
                </li>
            )}
              {list.length === 0 && <li className="px-4 py-6 text-center text-xs text-muted">Sin intervenciones en este estado.</li>}
            </ul>
            <section className="rounded-lg border border-line bg-surface p-5">
              {current ? <InterventionEditor key={current.id + current.history.length} iv={current} /> : <p className="text-sm text-muted">Seleccione una intervención.</p>}
            </section>
          </div>
        </>
      }
    </main>);

}