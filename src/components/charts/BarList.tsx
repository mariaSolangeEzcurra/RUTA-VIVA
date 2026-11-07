import React, { useState } from 'react';
import { titleCase } from '../../utils/text';

interface BarListProps {
  data: {label: string;value: number;}[];
  unit: string;
  max?: number;
  color?: string;
  onSelect?: (label: string) => void;
  activeLabel?: string | null;
}

export function BarList({ data, unit, max = 8, color = 'bg-primary', onSelect, activeLabel }: BarListProps) {
  const [expanded, setExpanded] = useState(false);
  if (!data.length) return <p className="py-6 text-center text-xs text-muted">Sin datos disponibles para esta variable.</p>;
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const top = Math.max(1, ...data.map((d) => d.value));
  const shown = expanded ? data : data.slice(0, max);
  return (
    <div>
      <ul className="grid gap-1">
        {shown.map((d) => {
          const active = activeLabel === d.label;
          const content =
          <>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className={`truncate ${active ? 'font-bold text-primary' : 'font-medium text-ink'}`} title={d.label}>{titleCase(d.label)}</span>
                <span className="shrink-0 tabular-nums text-muted">{d.value.toLocaleString('es-PE')} · {Math.round(d.value / total * 100)} %</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas">
                <div className={`h-2 rounded-full transition-[width] duration-500 ease-out ${color} ${activeLabel && !active ? 'opacity-40' : ''}`} style={{ width: `${d.value / top * 100}%` }} />
              </div>
            </>;

          return (
            <li key={d.label}>
              {onSelect ?
              <button type="button" onClick={() => onSelect(d.label)} className={`block w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-canvas ${active ? 'bg-primary-soft' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`} aria-pressed={active}>{content}</button> :
              <div className="px-2 py-1.5">{content}</div>}
            </li>);

        })}
      </ul>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span>Unidad: {unit} · total {total.toLocaleString('es-PE')}</span>
        {data.length > max &&
        <button type="button" className="font-medium text-primary" onClick={() => setExpanded((e) => !e)}>
            {expanded ? 'Mostrar menos' : `Ver ${data.length - max} más`}
          </button>
        }
      </div>
    </div>);

}