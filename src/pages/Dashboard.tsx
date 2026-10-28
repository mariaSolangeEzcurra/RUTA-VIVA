import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, MapIcon, UploadIcon } from 'lucide-react';
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
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-medium text-primary">Piloto Región Arequipa · 2021–2025</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink">Del registro de siniestros a la priorización explicable de intervenciones viales</h1>
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
              <Link to="/datos" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-primary/90"><UploadIcon className="h-4 w-4" />Importar archivos Excel</Link>
              <Link to="/metodologia" className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas">Ver metodología</Link>
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

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Siniestralidad vial fatal · Región Arequipa</h1>
          <p className="mt-1 text-sm text-muted">
            Registros detallados georreferenciados {state.analysis?.yearsAnalyzed.length ? `${state.analysis.yearsAnalyzed[0]}–${state.analysis.yearsAnalyzed[state.analysis.yearsAnalyzed.length - 1]}` : ''} · datos preliminares
            {activeFilterCount(filters) > 0 && ` · ${activeFilterCount(filters)} filtro(s) activos desde el mapa o patrones`}
          </p>
        </div>
        <Link to="/mapa" className="inline-flex h-10 items-center gap-2 self-start rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-primary/90"><MapIcon className="h-4 w-4" />Abrir mapa de siniestralidad</Link>
      </div>
      <KpiStrip />
      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Evolución anual" subtitle="Siniestros fatales (barras), fallecidos y lesionados (líneas) · conjunto filtrado">
          <AnnualChart views={filtered} height={320} />
        </Panel>
        <Panel title="Calidad y cobertura de los datos" subtitle="Conjunto filtrado">
          <QualitySummary report={quality} />
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Zonas con mayor IPIV" subtitle={state.analysis ? `Análisis de la versión v${state.analysis.dataVersion} · carga histórica, no riesgo relativo` : 'Análisis no ejecutado'}
        actions={<Link to="/ranking" className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary">Ranking completo <ArrowRightIcon className="h-3 w-3" /></Link>}>
          {top.length ?
          <ol className="divide-y divide-line">
              {top.map((z) =>
            <li key={z.id}>
                  <Link to={`/zona/${encodeURIComponent(z.id)}`} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-2.5 transition-colors duration-150 ease-out hover:bg-canvas">
                    <span className="text-center font-mono text-xs text-muted">{z.rank}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{z.distritos.map(titleCase).join(', ') || 'Distrito sin dato'}</span>
                      <span className="block truncate text-xs text-muted">{z.siniestros} siniestros · {z.fallecidos ?? 'sin dato de'} fallecidos · {z.years.length} año(s){z.dominantClass ? ` · ${titleCase(z.dominantClass.label)}` : ''}</span>
                    </span>
                    <span className="flex items-center gap-3"><span className="font-semibold tabular-nums">{z.ipiv}</span><PriorityBadge category={z.category} /></span>
                  </Link>
                </li>
            )}
            </ol> :

          <p className="py-6 text-center text-sm text-muted">{state.analysis ? 'No se formaron concentraciones con los parámetros actuales.' : 'Ejecute el reprocesamiento para calcular concentraciones e IPIV.'}</p>
          }
        </Panel>
        <Panel title="Serie histórica agregada" subtitle="Archivo histórico (separado de los registros detallados)">
          {state.historico.length ? <HistoricalChart rows={state.historico} /> : <p className="py-6 text-center text-sm text-muted">El archivo histórico 2008–2025 no ha sido importado.</p>}
        </Panel>
      </div>
    </main>);

}