import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownIcon, ArrowUpIcon, DownloadIcon } from 'lucide-react';
import type { Zone } from '../types/data';
import { useData } from '../contexts/DataContext';
import { useZoneTools } from '../hooks/useZoneTools';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { WeightsEditor } from '../components/ranking/WeightsEditor';
import { topContributors } from '../utils/ipiv';
import { qualityReport } from '../utils/quality';
import { downloadCsv } from '../utils/download';
import { formatPct, titleCase } from '../utils/text';

type SortKey = 'rank' | 'siniestros' | 'fallecidos' | 'years' | 'quality';

export function Ranking() {
  const { state, filtered } = useData();
  const { membersOf } = useZoneTools();
  const [sort, setSort] = useState<{key: SortKey;desc: boolean;}>({ key: 'rank', desc: false });
  const [onlyFiltered, setOnlyFiltered] = useState(false);
  const snap = state.analysis;

  const rows = useMemo(() => {
    if (!snap) return [];
    const ids = new Set(filtered.map((v) => v.zoneId));
    return snap.zones.
    filter((z) => !onlyFiltered || ids.has(z.id)).
    map((z) => ({ zone: z, quality: qualityReport(membersOf(z)).index }));
  }, [snap, filtered, onlyFiltered, membersOf]);

  const sorted = useMemo(() => {
    const val = (r: {zone: Zone;quality: number | null;}): number => {
      switch (sort.key) {
        case 'rank':return r.zone.rank;
        case 'siniestros':return r.zone.siniestros;
        case 'fallecidos':return r.zone.fallecidos ?? -1;
        case 'years':return r.zone.years.length;
        case 'quality':return r.quality ?? -1;
      }
    };
    return [...rows].sort((a, b) => sort.desc ? val(b) - val(a) : val(a) - val(b));
  }, [rows, sort]);

  const header = (key: SortKey, label: string, align = 'text-right') =>
  <th scope="col" className={`px-3 py-2 font-medium ${align}`} aria-sort={sort.key === key ? sort.desc ? 'descending' : 'ascending' : 'none'}>
      <button type="button" className="inline-flex items-center gap-1 whitespace-nowrap hover:text-ink" onClick={() => setSort({ key, desc: sort.key === key ? !sort.desc : key !== 'rank' })}>
        {label}{sort.key === key && (sort.desc ? <ArrowDownIcon className="h-3 w-3" /> : <ArrowUpIcon className="h-3 w-3" />)}
      </button>
    </th>;


  const exportCsv = () => downloadCsv(sorted.map(({ zone: z, quality }) => ({
    puesto: z.rank, zona: z.id, ipiv: z.ipiv, categoria: z.category, siniestros: z.siniestros, fallecidos: z.fallecidos, anios: z.years.join(' '),
    provincias: z.provincias.join(' / '), distritos: z.distritos.join(' / '), lat: z.centroid[0].toFixed(6), lon: z.centroid[1].toFixed(6), radio_m: Math.round(z.radiusM),
    calidad: quality === null ? '' : quality.toFixed(3), version_pesos: snap?.weightsVersion, version_datos: snap?.dataVersion
  })), `ranking_ipiv_v${snap?.dataVersion ?? 0}.csv`);

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
      <PageHeader
        title="Ranking de prioridad IPIV"
        description="Ranking de carga histórica: ordena las concentraciones por consecuencias, recurrencia, concentración y patrones de los siniestros registrados. No expresa probabilidad de accidente."
        actions={snap && <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-medium hover:bg-canvas"><DownloadIcon className="h-4 w-4" />Exportar CSV</button>} />
      
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          {!snap ?
          <EmptyState title="Ranking no calculado" description="Importe siniestros con coordenadas y ejecute el reprocesamiento para generar el ranking." actionLabel="Ir a Gestión de datos" actionTo="/datos" /> :

          <Panel
            title={`${rows.length} concentraciones`}
            subtitle={`${snap.weightsVersion} · datos v${snap.dataVersion} · DBSCAN ε=${snap.params.epsMeters} m, mín. ${snap.params.minPts}`}
            actions={<label className="flex items-center gap-2 whitespace-nowrap text-xs text-muted"><input type="checkbox" checked={onlyFiltered} onChange={(e) => setOnlyFiltered(e.target.checked)} className="accent-[rgb(21,94,117)]" />Solo con siniestros filtrados</label>}
            className="overflow-hidden">
            
              {rows.length === 0 ? <p className="py-6 text-center text-sm text-muted">No hay concentraciones para mostrar.</p> :
            <div className="-m-4 overflow-x-auto">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead className="bg-canvas text-xs text-muted">
                      <tr>
                        {header('rank', '#', 'text-left')}
                        <th scope="col" className="px-3 py-2 text-left font-medium">Zona</th>
                        <th scope="col" className="px-3 py-2 text-left font-medium">IPIV</th>
                        {header('siniestros', 'Siniestros')}
                        {header('fallecidos', 'Fallecidos')}
                        {header('years', 'Años')}
                        <th scope="col" className="px-3 py-2 text-left font-medium">Por qué ocupa este puesto</th>
                        {header('quality', 'Calidad dato')}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(({ zone: z, quality }) => {
                    const tc = topContributors(z, 2);
                    return (
                      <tr key={z.id} className="border-t border-line align-top transition-colors duration-150 ease-out hover:bg-canvas/60">
                            <td className="px-3 py-3 font-mono text-xs text-muted">{z.rank}</td>
                            <td className="px-3 py-3">
                              <Link to={`/zona/${encodeURIComponent(z.id)}`} className="font-medium text-primary hover:underline">{z.distritos.map(titleCase).join(', ') || 'Distrito sin dato'}</Link>
                              <p className="font-mono text-[11px] text-muted">{z.id}</p>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2"><span className="w-10 font-semibold tabular-nums">{z.ipiv}</span><PriorityBadge category={z.category} /></div>
                              <div className="mt-1.5 h-1 w-28 rounded-full bg-canvas"><div className="h-1 rounded-full bg-navy" style={{ width: `${z.ipiv}%` }} /></div>
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">{z.siniestros}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{z.fallecidos ?? <span className="text-xs text-muted">Sin dato</span>}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{z.years.length}</td>
                            <td className="max-w-[320px] px-3 py-3 text-xs text-muted">
                              {tc.length ? tc.map((c) => `${c.label} (+${c.contribution.toFixed(1)})`).join(' · ') : 'Sin aportes positivos'}
                              {z.dominantClass && <span className="block text-ink">{titleCase(z.dominantClass.label)} {Math.round(z.dominantClass.share * 100)} %</span>}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">{quality === null ? <span className="text-xs text-muted">No calc.</span> : formatPct(quality, 0)}</td>
                          </tr>);

                  })}
                    </tbody>
                  </table>
                </div>
            }
            </Panel>
          }
          <Panel title="Ranking de riesgo relativo por exposición" subtitle="Segundo ranking independiente">
            <p className="text-sm text-muted">No calculado. Requiere datos de flujo vehicular compatibles y representativos por tramo; los registros de peaje no representan el tránsito de toda una carretera. Sin exposición válida, el sistema solo afirma concentración histórica elevada de siniestros registrados.</p>
          </Panel>
        </div>
        <aside className="xl:sticky xl:top-28 xl:self-start">
          <Panel title="Pesos y parámetros" subtitle={state.weightsVersion}><WeightsEditor /></Panel>
        </aside>
      </div>
    </main>);

}