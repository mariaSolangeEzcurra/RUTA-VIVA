import React from 'react';
import type { Zone } from '../../types/data';
import type { MonthStat } from '../../utils/temporal';
import { MONTHS, MONTHS_SHORT } from '../../utils/temporal';
import { categoryHex } from '../../data/ipivConfig';
import { titleCase } from '../../utils/text';

export interface ZoneMonthRow {
  zone: Zone;
  label: string;
  months: MonthStat[];
  peak: number | null;
}

interface ZoneMonthMatrixProps {
  rows: ZoneMonthRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Lugares × meses: siniestros acumulados por mes en cada zona. */
export function ZoneMonthMatrix({ rows, selectedId, onSelect }: ZoneMonthMatrixProps) {
  const max = Math.max(1, ...rows.flatMap((r) => r.months.map((m) => m.total)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[11px]">
        <thead>
          <tr className="text-muted">
            <th scope="col" className="py-1 pr-2 text-left font-medium">Lugar</th>
            {MONTHS_SHORT.map((m) => <th key={m} scope="col" className="px-0.5 py-1 font-medium">{m}</th>)}
            <th scope="col" className="py-1 pl-2 text-left font-medium">Mes pico</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const active = r.zone.id === selectedId;
            return (
              <tr key={r.zone.id} className={active ? 'bg-primary-soft/60' : ''}>
                <th scope="row" className="max-w-[200px] py-0.5 pr-2 text-left font-normal">
                  <button type="button" onClick={() => onSelect(r.zone.id)} aria-pressed={active} className="flex w-full items-center gap-1.5 truncate text-left hover:text-primary">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: categoryHex[r.zone.category] }} aria-hidden />
                    <span className="font-mono text-muted">#{r.zone.rank}</span>
                    <span className={`truncate ${active ? 'font-semibold text-primary' : 'text-ink'}`}>{titleCase(r.label)}</span>
                  </button>
                </th>
                {r.months.map((m) =>
                <td key={m.month} className="px-0.5 py-0.5">
                    <button type="button" onClick={() => onSelect(r.zone.id)} tabIndex={-1} aria-hidden
                  className="flex h-6 w-full items-center justify-center rounded tabular-nums"
                  style={{ background: m.total ? `rgba(14,35,61,${0.1 + 0.8 * m.total / max})` : '#f3f5f8', color: m.total / max > 0.5 ? '#fff' : '#111827' }}
                  title={`${MONTHS[m.month]}: ${m.total}`}>
                      {m.total || ''}
                    </button>
                  </td>
                )}
                <td className="whitespace-nowrap py-0.5 pl-2">{r.peak === null ? <span className="text-muted">—</span> : MONTHS[r.peak]}</td>
              </tr>);

          })}
        </tbody>
      </table>
    </div>);

}