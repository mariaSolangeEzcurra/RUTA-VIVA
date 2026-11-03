import React from 'react';
import type { SiniestroView } from '../../types/data';
import { holidayNear, MONTHS } from '../../utils/temporal';
import { weekdayOf, weekdays } from '../../utils/parsing';
import { titleCase } from '../../utils/text';

export function MonthEventList({ events, month }: {events: SiniestroView[];month: number;}) {
  if (!events.length) return <p className="rounded-md bg-canvas px-3 py-4 text-center text-xs text-muted">Sin siniestros registrados en {MONTHS[month].toLowerCase()}.</p>;
  const years = Array.from(new Set(events.map((e) => e.anio))).sort();
  return (
    <div className="max-h-72 overflow-auto">
      {years.map((y) =>
      <div key={String(y)} className="mb-3">
          <p className="sticky top-0 bg-surface py-1 text-[11px] font-semibold text-navy">{MONTHS[month]} {y}</p>
          <ul className="divide-y divide-line/70">
            {events.filter((e) => e.anio === y).map((e) => {
            const wd = weekdayOf(e.fecha);
            const hol = holidayNear(e.fecha);
            return (
              <li key={e.codigo} className="grid grid-cols-[88px_1fr] gap-2 py-1.5 text-xs">
                  <div>
                    <p className="font-medium tabular-nums">{e.fecha?.slice(8, 10)} · {wd === null ? '' : weekdays[wd].slice(0, 3)}</p>
                    <p className="text-muted">{e.hora ?? 'hora s/d'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">{e.clase ? titleCase(e.clase) : 'Clase sin dato'}{e.fallecidos !== null && <span className="text-fatal"> · {e.fallecidos} fallecido(s)</span>}</p>
                    <p className="truncate text-muted">{e.causa ? titleCase(e.causa) : 'Causa sin dato'}</p>
                    {hol && <span className="mt-0.5 inline-block rounded bg-amber-50 px-1.5 text-[10px] text-[#7a3d06]">±1 día de {hol}</span>}
                  </div>
                </li>);

          })}
          </ul>
        </div>
      )}
    </div>);

}