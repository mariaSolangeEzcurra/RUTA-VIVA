import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagonIcon, ArrowRightIcon, BarChart3Icon, ListOrderedIcon, MapIcon, UploadIcon } from 'lucide-react';
import { pointHex } from '../utils/quarters';
import { ZonesMiniMap } from '../components/map/ZonesMiniMap';
import { categoryLabel } from '../data/ipivConfig';
import { useData } from '../contexts/DataContext';
import { KpiStrip } from '../components/KpiStrip';
import { Panel } from '../components/ui/Panel';
import { AnnualChart } from '../components/charts/AnnualChart';
import { HistoricalChart } from '../components/charts/HistoricalChart';
import { QualitySummary } from '../components/QualitySummary';
import { OriginalSourcesStatus } from '../components/OriginalSourcesStatus';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { qualityReport } from '../utils/quality';
import { activeFilterCount } from '../utils/filters';
import { titleCase } from '../utils/text';

export function Dashboard() {
  const { views, filtered, state, filters, ready } = useData();
  const quality = useMemo(() => qualityReport(filtered), [filtered]);
  const hasData = views.length > 0;
  const top = state.analysis?.zones.slice(0, 6) ?? [];

  if (ready && !hasData) {
    return (
      <main className="page">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-medium text-primary">Piloto Región Arequipa · 2021–2025</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">Del registro de siniestros a la priorización explicable de intervenciones viales</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              RUTA-VIVA PERÚ convierte los registros oficiales de siniestralidad en concentraciones geográficas, un ranking IPIV con su explicación,
              un índice separado de calidad del dato y fichas técnicas para inspección. Todas las cifras se calculan a partir de los archivos que usted importe;
              el sistema no muestra cifras de ejemplo.
            </p>
            <div className="mt-6 rounded-lg border border-warn/30 bg-amber-50 p-4 text-sm text-[#7a3d06]">
              <p className="font-semibold">Los archivos originales no están en este entorno</p>
              <p className="mt-1">Ninguna de las cuatro bases del ONSV se ha leído todavía, por eso no hay indicadores. Importe los archivos una vez: quedarán guardados en este navegador y no tendrá que cargarlos de nuevo.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/datos" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md transition-colors duration-150 ease-out hover:bg-primary/90"><UploadIcon className="h-4 w-4" />Importar archivos Excel</Link>
              <Link to="/metodologia" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-bold text-ink transition-colors duration-150 ease-out hover:bg-canvas">Ver metodología</Link>
            </div>
            <ol className="mt-8 grid gap-4 border-l border-line pl-5 text-sm">
              {[
              ['Siniestros fatales', 'Primero, para que personas y vehículos puedan vincularse por código.'],
              ['Personas y vehículos', 'Se anidan por siniestro sin multiplicar conteos.'],
              ['Estadística histórica 2008–2025', 'Se muestra por separado como serie agregada.'],
              ['Reprocesamiento', 'Genera concentraciones, ranking IPIV y explicaciones con una versión de datos.']].
              map(([t, d]) =>
              <li key={t}>
                  <p className="font-medium text-ink">{t}</p>
                  <p className="text-muted">{d}</p>
                </li>
              )}
            </ol>
          </div>
          <Panel title="Estado de las fuentes originales" subtitle="Verificado contra el historial de importaciones">
            <OriginalSourcesStatus />
          </Panel>
        </div>
        {state.historico.length > 0 &&
        <Panel title="Serie histórica agregada" className="mt-8"><HistoricalChart rows={state.historico} /></Panel>
        }
      </main>);

  }

  const zonesAll = state.analysis?.zones ?? [];
  const catCount = (c: string) => zonesAll.filter((z) => z.category === c).length;
  const years = state.analysis?.yearsAnalyzed ?? [];
  const shortcuts = [
  { to: '/mapa', icon: MapIcon, title: 'Ver el mapa', text: 'Ubique las zonas prioritarias y recorra los trimestres.', color: '#E11D48' },
  { to: '/patrones', icon: BarChart3Icon, title: 'Analizar patrones', text: 'Tendencias por trimestre, por qué subió o bajó y proyección.', color: '#0891B2' },
  { to: '/ranking', icon: ListOrderedIcon, title: 'Ranking de zonas', text: 'Todas las zonas ordenadas por su índice de prioridad.', color: '#0F766E' }];

  return (
    <main className="page">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight"><span className="h-8 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden />Siniestralidad vial fatal en Arequipa</h1>
          <p className="mt-2 pl-[18px] text-[15px] text-muted">
            Registros georreferenciados {years.length ? `${years[0]}–${years[years.length - 1]}` : ''}, datos preliminares
            {activeFilterCount(filters) > 0 && `. Hay ${activeFilterCount(filters)} filtro(s) activos.`}
          </p>
        </div>
        <Link to="/mapa" className="inline-flex h-11 items-center gap-2 self-start rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md transition-colors duration-150 ease-out hover:bg-primary/90"><MapIcon className="h-4 w-4" />Abrir el mapa</Link>
      </div>
      <KpiStrip />

      <div className="mt-8 grid gap-6 lg:gap-8 xl:grid-cols-2">
        <Panel title="Zonas a atender primero" icon={<AlertOctagonIcon className="h-4 w-4" />}
        subtitle={state.analysis ? 'Ordenadas por el índice de prioridad IPIV (0–100)' : 'Análisis no ejecutado'}
        actions={<Link to="/ranking" className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary-soft">Ver ranking <ArrowRightIcon className="h-3 w-3" /></Link>}>
          {top.length ?
          <>
              <div className="mb-3 flex flex-wrap gap-2">
                {(['muy_alta', 'alta', 'media', 'baja'] as const).map((c) => catCount(c) > 0 &&
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: pointHex[c] }} />{catCount(c)} {categoryLabel[c].toLowerCase()}</span>
              )}
              </div>
              <ol className="grid gap-1">
                {top.map((z) =>
              <li key={z.id}>
                    <Link to={`/zona/${encodeURIComponent(z.id)}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-2.5 transition-colors duration-150 ease-out hover:bg-canvas">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-md" style={{ background: pointHex[z.category] }}>{z.rank}</span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2"><span className="truncate text-sm font-bold">{z.distritos.map(titleCase).join(', ') || 'Distrito sin dato'}</span><PriorityBadge category={z.category} size="sm" /></span>
                        <span className="block truncate text-xs text-muted">{z.siniestros} siniestros · {z.fallecidos ?? 'sin dato de'} fallecidos · {z.years.length} año(s){z.dominantClass ? ` · ${titleCase(z.dominantClass.label)}` : ''}</span>
                        <span className="mt-1 block h-1.5 rounded-full bg-canvas group-hover:bg-white"><span className="block h-1.5 rounded-full" style={{ width: `${z.ipiv}%`, background: pointHex[z.category] }} /></span>
                      </span>
                      <span className="text-right"><span className="block text-lg font-bold tabular-nums leading-none">{z.ipiv}</span><span className="text-[10px] text-muted">IPIV</span></span>
                    </Link>
                  </li>
              )}
              </ol>
            </> :
          <p className="py-6 text-center text-sm text-muted">{state.analysis ? 'No se formaron concentraciones con los parámetros actuales.' : 'Ejecute el reprocesamiento para calcular concentraciones e IPIV.'}</p>
          }
        </Panel>
        <Panel title="Mapa de zonas" icon={<MapIcon className="h-4 w-4" />} subtitle="Cada número es el puesto de la zona; el color indica su prioridad. Toque una para ver su detalle."
        actions={<Link to="/mapa" className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary-soft">Mapa completo <ArrowRightIcon className="h-3 w-3" /></Link>}>
          {zonesAll.length ? <ZonesMiniMap zones={zonesAll} height={430} /> : <p className="py-10 text-center text-sm text-muted">Ejecute el reprocesamiento para ubicar las zonas.</p>}
        </Panel>
      </div>

      <div className="mt-8 grid gap-6 lg:gap-8 xl:grid-cols-2">
        <Panel title="Evolución anual" icon={<BarChart3Icon className="h-4 w-4" />} subtitle="Siniestros fatales (barras), fallecidos y lesionados (líneas)">
          <AnnualChart views={filtered} height={300} />
        </Panel>

        <Panel title="Calidad y cobertura de los datos" subtitle="Conjunto filtrado">
          <QualitySummary report={quality} />
        </Panel>
      </div>

      <div className="mt-8">
        <div className="grid gap-4 sm:grid-cols-3">
            {shortcuts.map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.to} to={c.to} className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-transparent hover:ring-2" style={{ ['--tw-ring-color' as string]: c.color }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: c.color }}><Icon className="h-4 w-4" /></span>
                  <p className="mt-2 text-sm font-bold text-ink">{c.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{c.text}</p>
                </Link>);
            })}
          </div>
      </div>

      {state.historico.length > 0 &&
      <div className="mt-8">
        <Panel title="Serie histórica agregada" subtitle="Archivo histórico (separado de los registros detallados)">
          {state.historico.length ? <HistoricalChart rows={state.historico} /> : <p className="py-6 text-center text-sm text-muted">El archivo histórico 2008–2025 no ha sido importado.</p>}
        </Panel>
      </div>
      }
    </main>);

}
