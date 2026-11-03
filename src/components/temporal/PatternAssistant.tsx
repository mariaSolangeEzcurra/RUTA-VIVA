import React, { useMemo, useState } from 'react';
import { SparklesIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useZoneTemporal } from '../../hooks/useZoneTemporal';
import { PriorityBadge } from '../ui/PriorityBadge';
import { MonthYearHeatmap } from './MonthYearHeatmap';
import { TemporalInsightPanel } from './TemporalInsightPanel';
import { MONTHS } from '../../utils/temporal';
import { titleCase } from '../../utils/text';

const ALL = '__todo__';

/** Asistente de patrones: ubicaciones recurrentes (DBSCAN sobre lat/lon) + análisis por mes y fecha. */
export function PatternAssistant() {
  const { filtered, state } = useData();
  const zones = useMemo(() => {
    const ids = new Set(filtered.map((v) => v.zoneId).filter(Boolean));
    return (state.analysis?.zones ?? []).
    filter((z) => ids.has(z.id)).
    sort((a, b) => b.years.length - a.years.length || b.siniestros - a.siniestros || a.rank - b.rank).
    slice(0, 10);
  }, [filtered, state.analysis]);
  const { coverage, rows, membersOf } = useZoneTemporal(zones);
  const [selected, setSelected] = useState<string>(ALL);
  const zone = zones.find((z) => z.id === selected) ?? null;
  const current = useMemo(() => zone ? membersOf(zone) : filtered, [zone, filtered, membersOf]);

  return (
    <div className="grid gap-6">
      <div>
        <h3 className="mb-2 text-xs font-semibold text-ink">Siniestros por mes y año · conjunto filtrado</h3>
        <MonthYearHeatmap views={filtered} coverage={coverage} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <div>
          <h3 className="mb-1 text-xs font-semibold text-ink">Lugares con mayor recurrencia</h3>
          <p className="mb-2 text-[11px] text-muted">Concentraciones detectadas por latitud y longitud, ordenadas por años distintos con siniestros.</p>
          {!state.analysis && <p className="mb-2 rounded bg-amber-50 px-2 py-1.5 text-[11px] text-[#7a3d06]">Ejecute el reprocesamiento para identificar lugares; mientras tanto se analiza toda la selección.</p>}
          <ul className="grid gap-1" role="listbox" aria-label="Lugar a analizar">
            <li>
              <button type="button" role="option" aria-selected={selected === ALL} onClick={() => setSelected(ALL)}
              className={`w-full rounded-md px-3 py-2 text-left text-xs transition-colors duration-150 ease-out ${selected === ALL ? 'bg-primary-soft font-semibold text-primary' : 'hover:bg-canvas'}`}>
                Toda la selección filtrada <span className="font-normal text-muted">· {filtered.length} siniestros</span>
              </button>
            </li>
            {rows.map((r) =>
            <li key={r.zone.id}>
                <button type="button" role="option" aria-selected={selected === r.zone.id} onClick={() => setSelected(r.zone.id)}
              className={`w-full rounded-md px-3 py-2 text-left transition-colors duration-150 ease-out ${selected === r.zone.id ? 'bg-primary-soft' : 'hover:bg-canvas'}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-xs font-medium ${selected === r.zone.id ? 'text-primary' : 'text-ink'}`}>{titleCase(r.label)}</span>
                    <PriorityBadge category={r.zone.category} />
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">{r.zone.years.length} años · {r.zone.siniestros} siniestros{r.peak !== null ? ` · pico en ${MONTHS[r.peak].toLowerCase()}` : ''}</span>
                </button>
              </li>
            )}
          </ul>
        </div>
        <div className="min-w-0 rounded-lg border border-line p-4">
          <TemporalInsightPanel
            key={selected}
            title={zone ? `${titleCase(zone.distritos.join(', ') || 'Lugar sin distrito')} · zona #${zone.rank}` : 'Toda la selección filtrada'}
            subtitle={zone ? `${zone.siniestros} siniestros en ${zone.years.join(', ')} · radio ${Math.round(zone.radiusM)} m` : `${current.length} siniestros · use los filtros para acotar provincia, tipo o periodo`}
            views={current}
            coverage={coverage}
            centroid={zone?.centroid ?? null}
            zoneId={zone?.id ?? null} />
          
        </div>
      </div>
      <p className="flex items-start gap-1.5 text-[11px] text-muted"><SparklesIcon className="mt-0.5 h-3 w-3 shrink-0" />Asistente analítico: combina agrupación espacial (DBSCAN), perfiles mensuales, ventanas de fechas recurrentes entre años, feriados y un modelo de Poisson. Las interpretaciones se generan con reglas explícitas y trazables, sin modelo de lenguaje.</p>
    </div>);

}