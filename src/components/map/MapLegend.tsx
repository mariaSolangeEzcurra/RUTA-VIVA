import React, { useState } from 'react';
import { ChevronDownIcon, MapIcon } from 'lucide-react';
import { categoryLabel } from '../../data/ipivConfig';
import type { PriorityCategory } from '../../types/data';
import { MAP_HEAT_CSS, QUARTERS, pointHex, quarterInfo } from '../../utils/quarters';
import type { ColorBy, MapMode } from './AccidentMap';

const Dot = ({ color, ring = '#ffffff' }: { color: string; ring?: string }) =>
  <span className="h-3 w-3 shrink-0 rounded-full shadow-sm" style={{ background: color, border: `1.5px solid ${ring}` }} />;

export function MapLegend({ mode, colorBy, defaultOpen = true }: { mode: MapMode; colorBy: ColorBy; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cats: PriorityCategory[] = ['muy_alta', 'alta', 'media', 'baja'];
  return (
    <div className="pointer-events-auto w-[210px] rounded-xl border border-line bg-surface/95 text-[11px] text-ink shadow-lg backdrop-blur">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 px-3 py-2 font-semibold" aria-expanded={open}>
        <span className="flex items-center gap-1.5"><MapIcon className="h-3.5 w-3.5 text-primary" />Leyenda</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open &&
      <div className="grid gap-2.5 border-t border-line px-3 pb-3 pt-2">
          {mode !== 'calor' && (colorBy === 'prioridad' ?
        <div>
              <p className="mb-1 font-semibold text-muted">Puntos · prioridad de su zona</p>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                {cats.map((c) => <li key={c} className="flex items-center gap-1.5"><Dot color={pointHex[c]} />{categoryLabel[c]}</li>)}
                <li className="col-span-2 flex items-center gap-1.5"><Dot color={pointHex.aislado} ring="#075985" />Siniestro aislado (sin zona)</li>
              </ul>
            </div> :
        <div>
              <p className="mb-1 font-semibold text-muted">Puntos · trimestre del siniestro</p>
              <ul className="grid gap-1">
                {QUARTERS.map((q) => <li key={q} className="flex items-center gap-1.5"><Dot color={quarterInfo[q].color} /><b>{quarterInfo[q].short}</b><span className="text-muted">{quarterInfo[q].months}</span></li>)}
              </ul>
            </div>)
        }
          {mode !== 'puntos' &&
        <div>
              <p className="mb-1 font-semibold text-muted">Mapa de calor · densidad</p>
              <div className="h-2.5 rounded-full" style={{ background: MAP_HEAT_CSS }} />
              <div className="mt-0.5 flex justify-between text-[10px] text-muted"><span>Menos</span><span>Más siniestros</span></div>
            </div>
        }
          <div>
            <p className="mb-1 font-semibold text-muted">Círculos · zonas de concentración</p>
            <div className="flex flex-wrap gap-1">
              {cats.map((c) => <span key={c} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ border: `1.5px solid ${pointHex[c]}`, background: `${pointHex[c]}22`, color: '#111827' }}>{categoryLabel[c]}</span>)}
            </div>
          </div>
          <p className="text-[10px] leading-snug text-muted">Las concentraciones son agrupaciones espaciales, no tramos viales verificados.</p>
        </div>
      }
    </div>);
}
