import React from 'react';
import type { MonthStat } from '../../utils/temporal';
import { MONTHS, MONTHS_SHORT } from '../../utils/temporal';

interface MonthBarsProps {
  months: MonthStat[];
  selected: number;
  onSelect: (m: number) => void;
  peak: number | null;
}

export function MonthBars({ months, selected, onSelect, peak }: MonthBarsProps) {
  const max = Math.max(0.0001, ...months.map((m) => m.mean ?? 0));
  return (
    <div>
      <div className="grid grid-cols-12 items-end gap-1" role="group" aria-label="Siniestros por mes">
        {months.map((m) => {
          const h = m.mean === null ? 0 : m.mean / max * 100;
          const active = m.month === selected;
          return (
            <button
              key={m.month}
              type="button"
              onClick={() => onSelect(m.month)}
              aria-pressed={active}
              aria-label={`${MONTHS[m.month]}: ${m.total} siniestros en ${m.yearsObserved} años`}
              className={`group flex h-32 flex-col items-center justify-end rounded-md px-0.5 pb-1 transition-colors duration-150 ease-out ${active ? 'bg-primary-soft' : 'hover:bg-canvas'}`}>
              
              <span className="mb-1 text-[10px] tabular-nums text-muted">{m.total || ''}</span>
              <span
                className={`w-full max-w-[22px] rounded-t ${m.yearsObserved === 0 ? 'border border-dashed border-line' : active ? 'bg-primary' : m.month === peak ? 'bg-fatal' : 'bg-navy/70'}`}
                style={{ height: `${Math.max(m.total ? 6 : 2, h * 0.8)}%` }} />
              
            </button>);

        })}
      </div>
      <div className="mt-1 grid grid-cols-12 gap-1 text-center text-[10px] text-muted">
        {MONTHS_SHORT.map((s, i) => <span key={s} className={i === selected ? 'font-semibold text-primary' : ''}>{s}</span>)}
      </div>
      <p className="mt-2 text-[11px] text-muted">Altura: promedio anual del mes (solo años con cobertura de ese mes). Número: total de siniestros. Rojo: mes pico. Seleccione un mes para ver su detalle.</p>
    </div>);

}