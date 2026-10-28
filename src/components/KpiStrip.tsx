import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { computeTotals } from '../utils/metrics';
import { activeFilterCount } from '../utils/filters';
import { formatInt, formatPct } from '../utils/text';

export function KpiStrip({ variant = 'page' }: {variant?: 'page' | 'overlay';}) {
  const { filtered, filters, state, views } = useData();
  const t = useMemo(() => computeTotals(filtered), [filtered]);
  const zoneIds = new Set(filtered.map((v) => v.zoneId).filter(Boolean));
  const priority = state.analysis ? state.analysis.zones.filter((z) => zoneIds.has(z.id) && (z.category === 'muy_alta' || z.category === 'alta')).length : null;
  const scope = activeFilterCount(filters) ? 'Conjunto filtrado' : 'Toda la región piloto';
  const items = [
  { label: 'Siniestros fatales', value: views.length ? formatInt(t.siniestros) : 'No disponible', note: null, lead: true },
  { label: 'Fallecidos', value: formatInt(t.fallecidos), note: t.fallecidos !== null && t.fallecidosSinDato ? `${t.fallecidosSinDato} sin dato` : null },
  { label: 'Lesionados', value: formatInt(t.lesionados), note: t.lesionados !== null && t.lesionadosSinDato ? `${t.lesionadosSinDato} sin dato` : null },
  { label: 'Zonas prioritarias', value: priority === null ? 'Sin análisis' : formatInt(priority), note: priority === null ? null : 'Alta y muy alta' },
  { label: 'Coordenadas válidas', value: formatPct(t.coordShare), note: t.coordShare !== null ? `${formatInt(t.coordValidas)} registros` : null }];

  const overlay = variant === 'overlay';
  return (
    <div className={overlay ? 'rounded-lg border border-line bg-surface/95 shadow-sm backdrop-blur' : 'rounded-lg border border-line bg-surface'}>
      <div className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
        {items.map((i) =>
        <div key={i.label} className={`px-4 ${overlay ? 'py-2.5' : 'py-4'}`}>
            <p className="whitespace-nowrap text-[11px] font-medium text-muted">{i.label}</p>
            <p className={`mt-0.5 font-semibold tabular-nums ${i.lead ? 'text-fatal' : 'text-ink'} ${overlay ? 'text-lg' : i.lead ? 'text-3xl' : 'text-2xl'} ${i.value.includes('No disponible') || i.value === 'Sin análisis' ? '!text-sm !font-medium !text-muted' : ''}`}>{i.value}</p>
            {i.note && <p className="text-[11px] text-muted">{i.note}</p>}
          </div>
        )}
      </div>
      <p className="border-t border-line px-4 py-1.5 text-[11px] text-muted">
        Ámbito: {scope}. Siniestros fatales registrados (datos preliminares). Fallecidos y lesionados se cuentan por persona vinculada o, en su defecto, por el registro del siniestro, sin duplicar.
      </p>
    </div>);

}