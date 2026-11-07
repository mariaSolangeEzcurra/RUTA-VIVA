import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { applyFilters, withoutPeriod } from '../../utils/filters';
import { datasetCoverage } from '../../utils/temporal';
import type { Quarter } from '../../utils/quarters';
import { periodLabel, projectNextYear, quarterFindings, quarterInfo, quarterProfile, quarterSeries } from '../../utils/quarters';
import { QuarterCards } from './QuarterCards';
import { QuarterTimelineChart } from './QuarterTimelineChart';
import { QuarterGroupedChart } from './QuarterGroupedChart';
import { QuarterHeatmap } from './QuarterHeatmap';
import { QuarterFindings } from './QuarterFindings';
import { ChangeExplainer } from './ChangeExplainer';
import { QuarterForecast } from './QuarterForecast';

function Step({ n, color, title, subtitle, children, actions }: { n: number; color: string; title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3" style={{ background: `linear-gradient(90deg, ${color}14, transparent 60%)` }}>
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm" style={{ background: color }}>{n}</span>
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </header>
      <div className="p-4">{children}</div>
    </section>);
}

/** Pestaña "Trimestres y tendencias": línea de tiempo, agrupación, calor, hallazgos, explicación de cambios y proyección. */
export function QuarterlyAnalysis() {
  const { views, filters, setFilters } = useData();
  const base = useMemo(() => applyFilters(views, withoutPeriod(filters)), [views, filters]);
  const coverage = useMemo(() => datasetCoverage(views), [views]);
  const series = useMemo(() => quarterSeries(base, coverage), [base, coverage]);
  const profile = useMemo(() => quarterProfile(series), [series]);
  const projection = useMemo(() => projectNextYear(series), [series]);
  const findings = useMemo(() => quarterFindings(series, profile, projection), [series, profile, projection]);

  const defaultSel = useMemo(() => {
    const drop = findings.find((f) => f.tone === 'down' && f.period);
    if (drop?.period) return drop.period;
    const last = [...series].reverse().find((s) => s.status === 'completo');
    return last ? { year: last.year, q: last.q } : null;
  }, [findings, series]);
  const [selected, setSelected] = useState<{ year: number; q: Quarter } | null>(null);
  useEffect(() => {
    if (!selected || !series.some((s) => s.year === selected.year && s.q === selected.q)) setSelected(defaultSel);
  }, [defaultSel, series]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (p: { year: number; q: Quarter }) => {
    setSelected(p);
    document.getElementById('por-que-cambio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!series.length) return <p className="rounded-lg border border-dashed border-line bg-surface py-10 text-center text-sm text-muted">No hay siniestros con fecha para construir la serie trimestral.</p>;

  const periodActive = filters.yearFrom !== null || filters.yearTo !== null || filters.trimestre !== null;

  return (
    <div className="grid gap-6">
      {periodActive &&
      <p className="rounded-lg border border-primary/20 bg-primary-soft/60 px-3 py-2 text-xs text-primary">
          Esta pestaña muestra todos los años y trimestres para poder comparar; el resto de filtros (provincia, tipo, causa…) sí se aplican.
        </p>
      }

      <Step n={1} color="#0891B2" title="¿Qué trimestre concentra más siniestros?" subtitle="Promedio anual por trimestre. Toque una tarjeta para filtrar todo el sistema (también el mapa) por ese trimestre.">
        <QuarterCards profile={profile} active={filters.trimestre as Quarter | null} onToggle={(q) => setFilters({ ...filters, trimestre: filters.trimestre === q ? null : q })} />
      </Step>

      <Step n={2} color="#0E233D" title="Línea de tiempo por trimestres" subtitle="Cada barra es un trimestre (color según T1–T4). La línea oscura suaviza la tendencia; la zona violeta es la proyección. Toque una barra para ver qué cambió.">
        <QuarterTimelineChart series={series} projection={projection} selected={selected} onSelect={pick} />
      </Step>

      <div className="grid gap-6 xl:grid-cols-2">
        <Step n={3} color="#6366F1" title="Agrupados: mismo trimestre, distintos años" subtitle="Permite ver si un trimestre sube o baja de un año a otro.">
          <QuarterGroupedChart series={series} />
        </Step>
        <Step n={4} color="#E6402A" title="Mapa de calor año × trimestre" subtitle="Mientras más rojo, más siniestros. Toque una celda para analizarla.">
          <QuarterHeatmap series={series} selected={selected} onSelect={pick} />
        </Step>
      </div>

      <Step n={5} color="#F59E0B" title="Hallazgos principales" subtitle="Generados automáticamente con reglas explícitas a partir de los datos filtrados.">
        <QuarterFindings findings={findings} onSelect={pick} />
      </Step>

      <div id="por-que-cambio" className="scroll-mt-32">
        <Step n={6} color="#16A34A" title={selected ? `¿Por qué cambió ${periodLabel(selected.year, selected.q)}?` : '¿Por qué cambió?'}
        subtitle="Compara el trimestre elegido y muestra qué provincias, tipos, causas, vehículos y horarios explican la subida o la bajada."
        actions={selected &&
        <select aria-label="Trimestre a analizar" value={`${selected.year}-${selected.q}`} onChange={(e) => {const [y, q] = e.target.value.split('-').map(Number);setSelected({ year: y, q: q as Quarter });}}
        className="h-8 rounded-md border border-line bg-surface px-2 text-xs font-semibold" style={{ color: quarterInfo[selected.q].color }}>
              {series.map((s) => <option key={s.key} value={`${s.year}-${s.q}`}>{periodLabel(s.year, s.q)}{s.status === 'parcial' ? ' (incompleto)' : ''}</option>)}
            </select>
        }>
          {selected ? <ChangeExplainer views={base} series={series} selected={selected} /> : <p className="text-xs text-muted">Elija un trimestre.</p>}
        </Step>
      </div>

      <Step n={7} color="#7C3AED" title={`Tendencia y proyección ${projection?.targetYear ?? 'del próximo año'}`} subtitle="Estimación orientativa para planificar operativos e inspecciones con anticipación.">
        <QuarterForecast projection={projection} profile={profile} />
      </Step>
    </div>);
}
