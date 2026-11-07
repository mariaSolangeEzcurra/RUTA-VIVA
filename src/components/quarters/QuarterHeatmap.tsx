import React, { useMemo } from 'react';
import type { Quarter, QuarterPoint } from '../../utils/quarters';
import { HEAT_GRADIENT_CSS, QUARTERS, heatColor, heatText, quarterInfo } from '../../utils/quarters';

interface Props {
  series: QuarterPoint[];
  selected: { year: number; q: Quarter } | null;
  onSelect: (p: { year: number; q: Quarter }) => void;
}

/** Mapa de calor año × trimestre: amarillo = pocos siniestros, rojo oscuro = muchos. */
export function QuarterHeatmap({ series, selected, onSelect }: Props) {
  const years = useMemo(() => Array.from(new Set(series.map((s) => s.year))).sort((a, b) => a - b), [series]);
  const complete = series.filter((s) => s.status === 'completo');
  const min = complete.length ? Math.min(...complete.map((s) => s.count)) : 0;
  const max = Math.max(1, ...series.map((s) => s.count));
  if (!years.length) return <p className="py-10 text-center text-xs text-muted">Sin registros con fecha.</p>;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[340px] border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th scope="col" className="w-14 text-left font-medium text-muted">Año</th>
              {QUARTERS.map((q) =>
              <th key={q} scope="col" className="font-semibold" style={{ color: quarterInfo[q].color }}>
                  {quarterInfo[q].short}<span className="block text-[10px] font-normal text-muted">{quarterInfo[q].months}</span>
                </th>
              )}
              <th scope="col" className="w-12 text-right font-medium text-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => {
              const row = QUARTERS.map((q) => series.find((s) => s.year === y && s.q === q) ?? null);
              return (
                <tr key={y}>
                  <th scope="row" className="text-left font-mono font-semibold text-ink">{y}</th>
                  {row.map((s, i) => {
                    if (!s) return <td key={i}><div className="flex h-11 items-center justify-center rounded-lg border border-dashed border-line text-muted" title="Sin cobertura de datos">—</div></td>;
                    const t = max > min ? (s.count - min) / (max - min) : 0.5;
                    const isSel = selected?.year === s.year && selected.q === s.q;
                    return (
                      <td key={i}>
                        <button type="button" onClick={() => onSelect({ year: s.year, q: s.q })}
                          title={`T${s.q} ${s.year}: ${s.count} siniestros${s.status === 'parcial' ? ' (incompleto)' : ''}`}
                          className={`flex h-11 w-full flex-col items-center justify-center rounded-lg font-bold tabular-nums transition-transform duration-150 hover:scale-105 ${isSel ? 'ring-2 ring-navy ring-offset-1' : ''}`}
                          style={s.status === 'parcial' ? { background: `repeating-linear-gradient(45deg, ${heatColor(t)}, ${heatColor(t)} 4px, #fff 4px, #fff 8px)`, color: '#3b1d06' } : { background: heatColor(t), color: heatText(t) }}>
                          {s.count}
                          {s.status === 'parcial' && <span className="text-[9px] font-medium">parcial</span>}
                        </button>
                      </td>);
                  })}
                  <td className="text-right font-semibold tabular-nums">{row.reduce((a, s) => a + (s?.count ?? 0), 0)}</td>
                </tr>);
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
        <span>Menos</span>
        <span className="h-2.5 flex-1 rounded-full" style={{ background: HEAT_GRADIENT_CSS }} />
        <span>Más siniestros</span>
      </div>
    </div>);
}
