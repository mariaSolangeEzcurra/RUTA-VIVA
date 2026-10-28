import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDownIcon } from 'lucide-react';
import type { PriorityCategory } from '../types/data';
import { useData } from '../contexts/DataContext';
import { useZoneTools } from '../hooks/useZoneTools';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Button } from '../components/ui/Button';
import { categoryLabel } from '../data/ipivConfig';
import { titleCase } from '../utils/text';

const contents = ['Código y localización', 'Croquis y coordenadas', 'Carretera y progresiva (si están verificadas)', 'Evidencia histórica y periodo', 'Siniestros y consecuencias', 'Patrón dominante', 'Cálculo y explicación del IPIV', 'Calidad del dato', 'Intervenciones candidatas y referencias', 'Entidad competente', 'Información faltante', 'Recomendación de inspección', 'Indicadores de resultado', 'Fuentes, fecha y versión de datos'];

export function TechnicalSheets() {
  const { state, stale } = useData();
  const { downloadFicha } = useZoneTools();
  const [cat, setCat] = useState<PriorityCategory | 'todas'>('todas');
  const zones = (state.analysis?.zones ?? []).filter((z) => cat === 'todas' || z.category === cat);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <PageHeader title="Fichas técnicas" description="Documento PDF por zona, generado a partir del último análisis y de la versión de datos vigente. Se descarga directamente, sin volver a cargar archivos." />
      {!state.analysis ?
      <div className="mt-6"><EmptyState title="No hay zonas analizadas" description="Las fichas se generan a partir del análisis de concentraciones e IPIV." actionLabel="Ir a Gestión de datos" actionTo="/datos" /></div> :

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            {stale && <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-[#7a3d06]">El análisis no corresponde a la versión de datos actual. Las fichas indicarán ambas versiones; se recomienda reprocesar antes de emitirlas.</p>}
            <div className="mb-3 flex items-center gap-2">
              <label htmlFor="cat" className="text-xs text-muted">Prioridad</label>
              <select id="cat" value={cat} onChange={(e) => setCat(e.target.value as PriorityCategory | 'todas')} className="h-8 rounded-md border border-line bg-surface px-2 text-xs">
                <option value="todas">Todas</option>
                {(Object.keys(categoryLabel) as PriorityCategory[]).map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
              </select>
              <span className="text-xs text-muted">{zones.length} zonas</span>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {zones.map((z) =>
            <li key={z.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <span className="w-8 font-mono text-xs text-muted">#{z.rank}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/zona/${encodeURIComponent(z.id)}`} className="text-sm font-medium text-primary hover:underline">{z.distritos.map(titleCase).join(', ') || 'Distrito sin dato'}</Link>
                    <p className="truncate font-mono text-[11px] text-muted">{z.id} · IPIV {z.ipiv} · {z.siniestros} siniestros</p>
                  </div>
                  <PriorityBadge category={z.category} />
                  <Button size="sm" variant="secondary" onClick={() => downloadFicha(z)}><FileDownIcon className="h-3.5 w-3.5" />Descargar PDF</Button>
                </li>
            )}
              {zones.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No hay zonas en esta categoría.</li>}
            </ul>
          </div>
          <aside className="rounded-lg border border-line bg-surface p-4 lg:self-start">
            <h2 className="text-sm font-semibold">Contenido de cada ficha</h2>
            <ol className="mt-3 grid list-decimal gap-1 pl-5 text-xs text-muted">{contents.map((c) => <li key={c}>{c}</li>)}</ol>
            <p className="mt-3 text-[11px] text-muted">El croquis es esquemático (posiciones relativas), no un mapa cartográfico.</p>
          </aside>
        </div>
      }
    </main>);

}