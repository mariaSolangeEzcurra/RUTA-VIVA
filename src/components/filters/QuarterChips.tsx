import React from 'react';
import { QUARTERS, quarterInfo } from '../../utils/quarters';
import type { Quarter } from '../../utils/quarters';

interface QuarterChipsProps {
  value: Quarter | null;
  onChange: (q: Quarter | null) => void;
  size?: 'sm' | 'md';
  showMonths?: boolean;
  counts?: Partial<Record<Quarter, number>>;
}

/** Selector de trimestre con un color propio por trimestre. */
export function QuarterChips({ value, onChange, size = 'md', showMonths = true, counts }: QuarterChipsProps) {
  const sm = size === 'sm';
  return (
    <div className={`grid grid-cols-[auto_repeat(4,minmax(0,1fr))] ${sm ? 'gap-1' : 'gap-1.5'}`} role="radiogroup" aria-label="Trimestre">
      <button
        type="button" role="radio" aria-checked={value === null} onClick={() => onChange(null)}
        className={`rounded-md border font-semibold transition-all duration-150 ease-out ${sm ? 'h-10 px-2.5 text-xs' : 'px-2 py-1.5 text-[11px]'} ${value === null ? 'border-navy bg-navy text-white shadow-sm' : 'border-line bg-surface text-muted hover:border-navy/40 hover:text-ink'}`}>
        Todos
      </button>
      {QUARTERS.map((q) => {
        const info = quarterInfo[q];
        const active = value === q;
        return (
          <button
            key={q} type="button" role="radio" aria-checked={active} onClick={() => onChange(active ? null : q)}
            title={`${info.label}: ${info.months}`}
            className={`flex flex-col items-center rounded-md border font-semibold leading-tight transition-all duration-150 ease-out ${sm ? 'h-10 justify-center px-1 text-xs' : 'px-1 py-1.5 text-xs'} ${active ? 'text-white shadow-md' : 'bg-surface hover:-translate-y-px'}`}
            style={active ? { background: info.color, borderColor: info.color } : { borderColor: `${info.color}66`, color: info.color }}>
            <span>{info.short}</span>
            {showMonths && !sm && <span className={`whitespace-nowrap text-[8.5px] font-medium tracking-tight ${active ? 'text-white/85' : 'text-muted'}`}>{info.months.replace(/ /g, '')}</span>}
            {counts && <span className={`text-[9px] font-medium tabular-nums ${active ? 'text-white/85' : 'text-muted'}`}>{counts[q] ?? 0}</span>}
          </button>);
      })}
    </div>);
}
