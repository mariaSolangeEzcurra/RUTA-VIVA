import React, { useMemo, useState } from 'react';
import { AlertOctagonIcon, ChevronRightIcon, MapIcon, XIcon } from 'lucide-react';
import type { PriorityCategory, Zone } from '../../types/data';
import { categoryLabel } from '../../data/ipivConfig';
import { pointHex } from '../../utils/quarters';
import { titleCase } from '../../utils/text';
import { KpiStrip } from '../KpiStrip';

interface Props {
  zones: Zone[];
  activeZoneId: string | null;
  onSelect: (id: string) => void;
  onClose?: () => void;
  hasAnalysis: boolean;
  tab: 'zonas' | 'leyenda';
  onTab: (t: 'zonas' | 'leyenda') => void;
  legend: React.ReactNode;
}

const CATS: PriorityCategory[] = ['muy_alta', 'alta', 'media', 'baja'];

/** Lista lateral de zonas ordenadas por prioridad; al tocar una, el mapa vuela hasta ella. */
export function MapZonesPanel({ zones, activeZoneId, onSelect, onClose, hasAnalysis, tab, onTab, legend }: Props) {
  const [cat, setCat] = useState<PriorityCategory | 'prioritarias' | null>('prioritarias');
  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c, zones.filter((z) => z.category === c).length])) as Record<PriorityCategory, number>, [zones]);
  const list = useMemo(() => [...zones].sort((a, b) => a.rank - b.rank).filter((z) => cat === null ? true : cat === 'prioritarias' ? z.category === 'muy_alta' || z.category === 'alta' : z.category === cat), [zones, cat]);
  const total = Math.max(1, zones.length);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line p-3">
        <div className="flex items-center gap-1">
          <div className="flex flex-1 rounded-xl bg-canvas p-1" role="tablist">
            {([['zonas', 'Zonas a atender', AlertOctagonIcon], ['leyenda', 'Leyenda', MapIcon]] as const).map(([id, label, Icon]) =>
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)}
            className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${tab === id ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(15,42,61,0.18)]' : 'text-muted hover:text-ink'}`}>
                <Icon className={`h-3.5 w-3.5 ${id === 'zonas' ? 'text-[#E11D48]' : 'text-primary'}`} />{label}
              </button>
            )}
          </div>
          {onClose && <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-canvas" aria-label="Cerrar panel"><XIcon className="h-4 w-4" /></button>}
        </div>
        {tab === 'zonas' && <div className="mt-3"><KpiStrip variant="compact" /></div>}
      </div>

      {tab === 'leyenda' ? <div className="scrollbar-thin flex-1 overflow-y-auto p-4">{legend}</div> :
      !hasAnalysis ?
      <p className="m-4 rounded-xl bg-amber-50 p-3 text-xs text-[#7a3d06]">Ejecute el reprocesamiento desde la barra amarilla superior para identificar las zonas de concentración y su prioridad.</p> :
      <>
          <div className="border-b border-line px-4 py-3">
            <div className="flex h-3 overflow-hidden rounded-full bg-canvas" aria-hidden>
              {CATS.map((c) => counts[c] > 0 && <div key={c} style={{ width: `${(counts[c] / total) * 100}%`, background: pointHex[c] }} />)}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filtrar zonas por prioridad">
              <button type="button" role="radio" aria-checked={cat === 'prioritarias'} onClick={() => setCat('prioritarias')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${cat === 'prioritarias' ? 'bg-navy text-white' : 'bg-canvas text-muted hover:text-ink'}`}>
                Prioritarias · {counts.muy_alta + counts.alta}
              </button>
              {CATS.map((c) =>
            <button key={c} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(cat === c ? null : c)} disabled={!counts[c]}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold transition-colors disabled:opacity-40"
            style={cat === c ? { background: pointHex[c], borderColor: pointHex[c], color: c === 'media' ? '#422006' : '#fff' } : { borderColor: `${pointHex[c]}66`, color: '#16202A' }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: cat === c ? '#fff' : pointHex[c] }} />{categoryLabel[c]} {counts[c]}
                </button>
            )}
              <button type="button" role="radio" aria-checked={cat === null} onClick={() => setCat(null)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cat === null ? 'bg-navy text-white' : 'bg-canvas text-muted hover:text-ink'}`}>Todas · {zones.length}</button>
            </div>
          </div>
          <ol className="scrollbar-thin flex-1 overflow-y-auto p-2">
            {list.length === 0 && <li className="p-6 text-center text-xs text-muted">No hay zonas de esta categoría con los filtros actuales.</li>}
            {list.map((z) => {
            const color = pointHex[z.category];
            const active = z.id === activeZoneId;
            return (
              <li key={z.id}>
                  <button type="button" onClick={() => onSelect(z.id)}
                className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${active ? 'bg-canvas ring-2 ring-navy/80' : 'hover:bg-canvas'}`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-md" style={{ background: color }}>{z.rank}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">{titleCase(z.distritos.join(', ') || 'Distrito sin dato')}</span>
                      <span className="block truncate text-[11px] text-muted">{z.siniestros} siniestros · {z.fallecidos ?? '—'} fallecidos · {z.years.length} años</span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className="h-1.5 flex-1 rounded-full bg-line/70"><span className="block h-1.5 rounded-full" style={{ width: `${z.ipiv}%`, background: color }} /></span>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: z.category === 'media' ? '#A16207' : color }}>IPIV {z.ipiv}</span>
                      </span>
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
                  </button>
                </li>);
          })}
          </ol>
        </>
      }
    </div>);
}
