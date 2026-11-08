import React, { useMemo } from 'react';
import { AlertOctagonIcon, CrosshairIcon, HeartPulseIcon, SirenIcon, UsersIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { computeTotals } from '../utils/metrics';
import { activeFilterCount } from '../utils/filters';
import { formatInt, formatPct } from '../utils/text';
import { AnimatedNumber } from './ui/AnimatedNumber';

export function KpiStrip({ variant = 'page' }: {variant?: 'page' | 'overlay' | 'compact';}) {
  const { filtered, filters, state, views } = useData();
  const t = useMemo(() => computeTotals(filtered), [filtered]);
  const zoneIds = new Set(filtered.map((v) => v.zoneId).filter(Boolean));
  const priority = state.analysis ? state.analysis.zones.filter((z) => zoneIds.has(z.id) && (z.category === 'muy_alta' || z.category === 'alta')).length : null;
  const scope = activeFilterCount(filters) ? 'Conjunto filtrado' : 'Toda la región piloto';
  const items = [
  { label: 'Siniestros fatales', raw: views.length ? t.siniestros : null, pct: false, value: views.length ? formatInt(t.siniestros) : 'No disponible', note: scope, icon: SirenIcon, tone: 'bg-[#FDE8EC] text-[#C81E32]' },
  { label: 'Fallecidos', raw: t.fallecidos, pct: false, value: formatInt(t.fallecidos), note: t.fallecidos !== null && t.fallecidosSinDato ? `${t.fallecidosSinDato} sin dato` : 'personas', icon: HeartPulseIcon, tone: 'bg-[#FDE8EC] text-[#9F1239]' },
  { label: 'Lesionados', raw: t.lesionados, pct: false, value: formatInt(t.lesionados), note: t.lesionados !== null && t.lesionadosSinDato ? `${t.lesionadosSinDato} sin dato` : 'personas', icon: UsersIcon, tone: 'bg-[#FEF3C7] text-[#92400E]' },
  { label: 'Zonas prioritarias', raw: priority, pct: false, value: priority === null ? 'Sin análisis' : formatInt(priority), note: priority === null ? 'Ejecute el reprocesamiento' : 'Prioridad alta y muy alta', icon: AlertOctagonIcon, tone: 'bg-[#FFEDD5] text-[#C2410C]' },
  { label: 'Coordenadas válidas', raw: t.coordShare, pct: true, value: formatPct(t.coordShare), note: t.coordShare !== null ? `${formatInt(t.coordValidas)} ubicados en el mapa` : null, icon: CrosshairIcon, tone: 'bg-primary-soft text-primary' }];

  const compact = variant !== 'page';
  const num = (i: typeof items[number]) => i.raw === null || i.raw === undefined ? i.value : <AnimatedNumber value={i.raw} format={(n) => i.pct ? formatPct(n) : formatInt(Math.round(n))} />;
  if (compact) {
    const mini = [items[0], items[1], items[3]];
    return (
      <div className="grid grid-cols-3 gap-2">
        {mini.map((i, idx) => {
          const muted = i.value.includes('No disponible') || i.value === 'Sin análisis';
          return (
            <div key={i.label} className="rounded-xl bg-canvas px-2.5 py-2">
              <p className={`font-bold tabular-nums leading-tight ${muted ? 'text-xs text-muted' : 'text-xl'} ${idx === 0 ? 'text-[#C81E32]' : idx === 2 ? 'text-[#C2410C]' : 'text-ink'}`}>{num(i)}</p>
              <p className="text-[10px] font-semibold leading-tight text-muted">{i.label}</p>
            </div>);
        })}
      </div>);
  }
  return (
    <div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
        {items.map((i, idx) => {
          const Icon = i.icon;
          const muted = i.value.includes('No disponible') || i.value === 'Sin análisis';
          return (
            <div key={i.label} className={`flex items-start gap-3 rounded-2xl border border-line bg-surface ${compact ? 'p-3' : 'p-4'} ${!compact && idx === 0 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <span className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'} ${i.tone}`}><Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} /></span>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight text-muted">{i.label}</p>
                <p className={`font-bold tabular-nums leading-tight ${idx === 0 ? 'text-[#C81E32]' : 'text-ink'} ${muted ? '!text-sm !font-semibold !text-muted' : compact ? 'text-xl' : 'whitespace-nowrap text-2xl sm:text-[28px]'}`}>{num(i)}</p>
                {i.note && <p className="text-[11px] leading-snug text-muted">{i.note}</p>}
              </div>
            </div>);
        })}
      </div>
      {!compact &&
      <p className="mt-2 px-1 text-[11px] text-muted">
          Siniestros fatales registrados (datos preliminares). Fallecidos y lesionados se cuentan por persona vinculada o, en su defecto, por el registro del siniestro, sin duplicar.
        </p>
      }
    </div>);

}
