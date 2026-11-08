import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarRangeIcon, CarIcon, ClockIcon, MapPinnedIcon, SparklesIcon } from 'lucide-react';
import { QuarterlyAnalysis } from '../components/quarters/QuarterlyAnalysis';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterPanel } from '../components/filters/FilterPanel';
import { BarList } from '../components/charts/BarList';
import { HourChart } from '../components/charts/HourChart';
import { PatternAssistant } from '../components/temporal/PatternAssistant';
import { countBy, computeTotals } from '../utils/metrics';
import { weekdayOf, weekdays } from '../utils/parsing';
import { formatInt, formatPct, titleCase } from '../utils/text';
import type { Filters } from '../types/data';

function ageGroup(e: number | null): string | null {
  if (e === null) return null;
  if (e < 18) return '0–17 años';
  if (e < 30) return '18–29 años';
  if (e < 45) return '30–44 años';
  if (e < 65) return '45–64 años';
  return '65 años o más';
}

const TABS = [
{ id: 'trimestres', label: 'Trimestres y tendencias', short: 'Trimestres', icon: CalendarRangeIcon, color: '#0891B2' },
{ id: 'temporal', label: 'Meses y lugares recurrentes', short: 'Meses', icon: SparklesIcon, color: '#7C3AED' },
{ id: 'territorio', label: 'Territorio', short: 'Territorio', icon: MapPinnedIcon, color: '#16A34A' },
{ id: 'siniestro', label: 'Tipo, causa y horario', short: 'Tipo y hora', icon: ClockIcon, color: '#EA580C' },
{ id: 'usuarios', label: 'Usuarios y vehículos', short: 'Usuarios', icon: CarIcon, color: '#E11D48' }] as
const;
type TabId = typeof TABS[number]['id'];

export function Patterns() {
  const { filtered, views, filters, setFilters, state } = useData();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('vista'))?.id ?? 'trimestres') as TabId;
  const setTab = (t: TabId) => setParams((p) => {p.set('vista', t);return p;}, { replace: true });
  const toggle = (k: keyof Filters, v: string) => setFilters({ ...filters, [k]: filters[k] === v ? null : v, ...(k === 'provincia' ? { distrito: null } : {}) });

  const d = useMemo(() => {
    const personas = filtered.flatMap((v) => v.personas);
    const provinces = Array.from(new Set(filtered.map((v) => v.provincia).filter((x): x is string => !!x)));
    return {
      provincia: countBy(filtered, (v) => v.provincia),
      distrito: countBy(filtered, (v) => v.distrito),
      clase: countBy(filtered, (v) => v.clase),
      causa: countBy(filtered, (v) => v.causa),
      dia: countBy(filtered, (v) => {const w = weekdayOf(v.fecha);return w === null ? null : weekdays[w];}),
      vehiculo: countBy(filtered, (v) => v.tiposVehiculo),
      usuario: countBy(personas, (p) => p.tipoUsuario),
      condicion: countBy(personas, (p) => p.condicion),
      edad: countBy(personas, (p) => ageGroup(p.edad)),
      personas: personas.length,
      comparison: provinces.map((p) => {
        const sub = filtered.filter((v) => v.provincia === p);
        const t = computeTotals(sub);
        const valid = sub.filter((v) => v.coordStatus === 'valida');
        return { provincia: p, siniestros: t.siniestros, fallecidos: t.fallecidos, enConcentracion: valid.length ? valid.filter((v) => v.zoneId).length / valid.length : null };
      }).sort((a, b) => b.siniestros - a.siniestros),
      vias: countBy(filtered, (v) => v.via)
    };
  }, [filtered]);

  const snap = state.analysis;

  if (!views.length) {
    return <main className="mx-auto w-full max-w-3xl px-4 py-12"><EmptyState title="Sin datos para analizar patrones" description="Importe la base de siniestros para generar distribuciones territoriales, temporales y por usuario vial." actionLabel="Ir a Gestión de datos" actionTo="/datos" /></main>;
  }

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <main className="page">
      <PageHeader title="Análisis de patrones" description="Explore los datos por pestañas: empiece por Trimestres y tendencias. Los filtros de la izquierda afectan a todas las vistas y también al mapa." />

      <nav aria-label="Vistas de análisis" className="sticky top-[59px] z-[800] -mx-4 mt-5 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur lg:top-[99px] lg:mx-0 lg:rounded-xl lg:border lg:bg-surface/95 lg:px-2">
        <ul role="tablist" className="flex gap-1.5 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.id === tab;
            const Icon = t.icon;
            return (
              <li key={t.id} className="shrink-0">
                <button type="button" role="tab" aria-selected={active} onClick={() => setTab(t.id)}
                className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-all duration-150 ${active ? 'text-white shadow-md' : 'text-muted hover:bg-canvas hover:text-ink'}`}
                style={active ? { background: t.color } : undefined}>
                  <Icon className="h-3.5 w-3.5" style={active ? undefined : { color: t.color }} />
                  <span className="sm:hidden">{t.short}</span><span className="hidden sm:inline">{t.label}</span>
                </button>
              </li>);
          })}
        </ul>
      </nav>

      <div className="mt-8 grid gap-6 lg:gap-8 lg:grid-cols-[270px_1fr]">
        <aside className="lg:sticky lg:top-44 lg:max-h-[calc(100vh-12rem)] lg:self-start lg:overflow-y-auto" aria-label="Filtros">
          <details className="group rounded-xl border border-line bg-surface lg:hidden">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold">Filtros <span className="text-xs font-normal text-muted">{filtered.length} de {views.length} siniestros</span></summary>
            <div className="border-t border-line p-4"><FilterPanel compact /></div>
          </details>
          <div className="hidden lg:block"><Panel title="Filtros"><FilterPanel compact /></Panel></div>
        </aside>

        <div className="grid min-w-0 content-start gap-6" role="tabpanel" aria-label={activeTab.label}>
          {tab === 'trimestres' && <QuarterlyAnalysis />}

          {tab === 'temporal' &&
          <Panel title="Asistente de patrones temporales y ubicaciones recurrentes" subtitle="Interpreta las coordenadas, identifica los lugares que se repiten y analiza qué ocurrió por mes y fecha">
              <PatternAssistant />
            </Panel>
          }

          {tab === 'territorio' &&
          <>
              <div className="grid gap-6 xl:grid-cols-2">
                <Panel title="Por provincia" subtitle="Siniestros fatales · toque para filtrar"><BarList data={d.provincia} unit="siniestros" onSelect={(l) => toggle('provincia', l)} activeLabel={filters.provincia} /></Panel>
                <Panel title="Por distrito" subtitle="Siniestros fatales · toque para filtrar"><BarList data={d.distrito} unit="siniestros" onSelect={(l) => toggle('distrito', l)} activeLabel={filters.distrito} /></Panel>
              </div>
              <Panel title="Comparación entre provincias" subtitle="Conjunto filtrado">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead><tr className="border-b border-line text-left text-xs text-muted"><th scope="col" className="py-2 font-medium">Provincia</th><th scope="col" className="py-2 text-right font-medium">Siniestros</th><th scope="col" className="py-2 text-right font-medium">Fallecidos</th><th scope="col" className="py-2 text-right font-medium">% en concentraciones</th></tr></thead>
                    <tbody>
                      {d.comparison.map((r) =>
                    <tr key={r.provincia} className="border-b border-line/70">
                          <td className="py-2">{titleCase(r.provincia)}</td>
                          <td className="py-2 text-right tabular-nums">{formatInt(r.siniestros)}</td>
                          <td className="py-2 text-right tabular-nums">{formatInt(r.fallecidos)}</td>
                          <td className="py-2 text-right tabular-nums">{snap ? formatPct(r.enConcentracion, 0) : 'Sin análisis'}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </Panel>
              {d.vias.length > 0 &&
            <Panel title="Corredores viales registrados" subtitle="Código de vía según la fuente, sin verificar contra red oficial">
                  <BarList data={d.vias} unit="siniestros" onSelect={(l) => toggle('via', l)} activeLabel={filters.via} />
                </Panel>
            }
            </>
          }

          {tab === 'siniestro' &&
          <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Tipo de siniestro" subtitle="Clase registrada"><BarList data={d.clase} unit="siniestros" color="bg-navy" onSelect={(l) => toggle('clase', l)} activeLabel={filters.clase} /></Panel>
              <Panel title="Causa registrada" subtitle="Según la fuente; no equivale a causa verificada"><BarList data={d.causa} unit="siniestros" color="bg-navy" onSelect={(l) => toggle('causa', l)} activeLabel={filters.causa} /></Panel>
              <Panel title="Distribución horaria"><HourChart views={filtered} /></Panel>
              <Panel title="Día de la semana" subtitle="Siniestros fatales"><BarList data={d.dia.length > 0 ? weekdays.map((w) => d.dia.find((x) => x.label === w) ?? { label: w, value: 0 }) : []} unit="siniestros" max={7} /></Panel>
            </div>
          }

          {tab === 'usuarios' &&
          <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Participación por tipo de vehículo" subtitle="Siniestros con al menos un vehículo del tipo (un siniestro puede contar en varios tipos)"><BarList data={d.vehiculo} unit="siniestros" color="bg-warn" onSelect={(l) => toggle('tipoVehiculo', l)} activeLabel={filters.tipoVehiculo} /></Panel>
              <Panel title="Perfil de usuarios viales" subtitle={`Personas vinculadas: ${formatInt(d.personas)}`}>
                <BarList data={d.usuario} unit="personas" color="bg-warn" onSelect={(l) => toggle('tipoUsuario', l)} activeLabel={filters.tipoUsuario} />
                {d.edad.length > 0 && <div className="mt-5 border-t border-line pt-4"><h3 className="mb-2 text-xs font-semibold">Grupo de edad</h3><BarList data={d.edad} unit="personas" /></div>}
                {d.condicion.length > 0 && <div className="mt-5 border-t border-line pt-4"><h3 className="mb-2 text-xs font-semibold">Condición</h3><BarList data={d.condicion} unit="personas" color="bg-fatal" /></div>}
              </Panel>
            </div>
          }
        </div>
      </div>
    </main>);

}
