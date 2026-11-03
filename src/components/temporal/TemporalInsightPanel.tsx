import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, SparklesIcon } from 'lucide-react';
import type { SiniestroView } from '../../types/data';
import type { Coverage } from '../../utils/temporal';
import { analyzeTemporal, forecastMonth, monthEvents, MONTHS, temporalInsights } from '../../utils/temporal';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { RECOMMENDATION_DISCLAIMER } from '../../data/interventionCatalog';
import { formatPct } from '../../utils/text';
import { MonthBars } from './MonthBars';
import { MonthEventList } from './MonthEventList';
import { InsightList } from './InsightList';

interface TemporalInsightPanelProps {
  title: string;
  subtitle?: string;
  views: SiniestroView[];
  coverage: Coverage;
  centroid?: [number, number] | null;
  zoneId?: string | null;
}

export function TemporalInsightPanel({ title, subtitle, views, coverage, centroid, zoneId }: TemporalInsightPanelProps) {
  const profile = useMemo(() => analyzeTemporal(views, coverage), [views, coverage]);
  const defaultMonth = profile.peak?.month ?? (new Date().getMonth() + 1) % 12;
  const [month, setMonth] = useState<number>(defaultMonth);
  const place = useReverseGeocode(centroid ?? null);
  const events = useMemo(() => monthEvents(views, month), [views, month]);
  const insights = useMemo(() => temporalInsights(profile, views, month), [profile, views, month]);
  const f = forecastMonth(profile.months[month]);

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          {centroid &&
          <p className="mt-1 flex items-start gap-1 text-xs text-muted">
              <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-mono">{centroid[0].toFixed(5)}, {centroid[1].toFixed(5)}</span>
                {place.status === 'loading' && ' · interpretando ubicación…'}
                {place.status === 'ok' && place.label && <> · cerca de <span className="text-ink">{place.label}</span> <span className="text-[10px]">(OpenStreetMap, no verificado)</span></>}
                {place.status === 'error' && ' · referencia de lugar no disponible'}
              </span>
            </p>
          }
        </div>
        {zoneId && <Link to={`/zona/${encodeURIComponent(zoneId)}`} className="shrink-0 text-xs font-medium text-primary">Detalle de la zona →</Link>}
      </header>

      <MonthBars months={profile.months} selected={month} onSelect={setMonth} peak={profile.peak?.month ?? null} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <h4 className="mb-2 text-xs font-semibold text-ink">¿Qué ocurrió en {MONTHS[month].toLowerCase()}? <span className="font-normal text-muted">({events.length} siniestros)</span></h4>
          <MonthEventList events={events} month={month} />
          <div className="mt-4 rounded-md border border-line p-3">
            <p className="text-[11px] text-muted">Expectativa histórica para {MONTHS[month].toLowerCase()}</p>
            {f.lambda === null ? <p className="mt-1 text-sm text-muted">Sin años con cobertura de este mes.</p> :
            <div className="mt-1 grid grid-cols-3 gap-2">
                <div><p className="text-lg font-semibold tabular-nums">{f.lambda.toFixed(2)}</p><p className="text-[10px] text-muted">promedio anual</p></div>
                <div><p className="text-lg font-semibold tabular-nums">{f.low}–{f.high}</p><p className="text-[10px] text-muted">rango probable (80 %)</p></div>
                <div><p className="text-lg font-semibold tabular-nums">{formatPct(f.pAtLeastOne, 0)}</p><p className="text-[10px] text-muted">prob. ≥ 1 siniestro</p></div>
              </div>
            }
            <p className="mt-2 text-[10px] text-muted">Modelo de Poisson con la media histórica del mes ({f.yearsUsed} años, confianza {f.confidence}). No incorpora tránsito, clima ni intervenciones.</p>
          </div>
        </div>
        <div className="rounded-md bg-canvas/70 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-navy"><SparklesIcon className="h-3.5 w-3.5" />Interpretación automática</p>
          <InsightList insights={insights} />
          <p className="mt-4 border-t border-line pt-2 text-[10px] text-muted">Generado por reglas estadísticas sobre los registros. {RECOMMENDATION_DISCLAIMER}</p>
        </div>
      </div>
    </div>);

}