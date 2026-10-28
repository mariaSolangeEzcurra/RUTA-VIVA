import React from 'react';
import { categoryHex, categoryLabel } from '../../data/ipivConfig';
import type { PriorityCategory } from '../../types/data';

export function MapLegend() {
  const cats: PriorityCategory[] = ['muy_alta', 'alta', 'media', 'baja'];
  return (
    <div className="pointer-events-auto rounded-md border border-line bg-surface/95 p-3 text-[11px] text-ink shadow-sm backdrop-blur">
      <p className="mb-1.5 font-semibold">Leyenda</p>
      <ul className="grid gap-1">
        <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border border-white bg-[#BE1228] ring-1 ring-[#BE1228]" />Siniestro en concentración</li>
        <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border-2 border-[#4b5563] bg-white" />Siniestro aislado</li>
      </ul>
      <p className="mb-1 mt-2 font-semibold">Concentraciones (IPIV)</p>
      <ul className="grid gap-1">
        {cats.map((c) =>
        <li key={c} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2" style={{ borderColor: categoryHex[c], background: `${categoryHex[c]}33` }} />
            {categoryLabel[c]}
          </li>
        )}
      </ul>
      <p className="mt-2 max-w-[180px] text-muted">Las concentraciones son agrupaciones espaciales, no tramos viales verificados.</p>
    </div>);

}