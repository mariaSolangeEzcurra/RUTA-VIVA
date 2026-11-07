import React, { useMemo } from 'react';
import type { SiniestroView } from '../../types/data';
import type { Coverage } from '../../utils/temporal';
import { MONTHS, MONTHS_SHORT, monthOf } from '../../utils/temporal';
import { HEAT_GRADIENT_CSS, heatColor, heatText } from '../../utils/quarters';

interface MonthYearHeatmapProps {
  views: SiniestroView[];
  coverage: Coverage;
  selectedMonth?: number | null;
  onSelectMonth?: (m: number) => void;
}

export function MonthYearHeatmap({ views, coverage, selectedMonth, onSelectMonth }: MonthYearHeatmapProps) {
  const years = useMemo(() => Array.from(coverage.keys()).sort((a, b) => a - b), [coverage]);
  const grid = useMemo(() => {
    const g = new Map<string, number>();
    views.forEach((v) => {
      const m = monthOf(v.fecha);
      if (m !== null && v.anio !== null) g.set(`${v.anio}-${m}`, (g.get(`${v.anio}-${m}`) ?? 0) + 1);
    });
    return g;
  }, [views]);
  const max = Math.max(1, ...Array.from(grid.values()));
  if (!years.length) return <p className="py-6 text-center text-xs text-muted">Sin registros con fecha.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-[11px]">
        <thead>
          <tr>
            <th scope="col" className="w-12 py-1 text-left font-medium text-muted">Año</th>
            {MONTHS_SHORT.map((m, i) =>
            <th key={m} scope="col" className="px-0.5 py-1 font-medium">
                {onSelectMonth ?
              <button type="button" onClick={() => onSelectMonth(i)} aria-pressed={selectedMonth === i} title={`Analizar ${MONTHS[i].toLowerCase()}`}
              className={`w-full rounded px-1 py-0.5 ${selectedMonth === i ? 'bg-primary text-white' : 'text-muted hover:bg-canvas'}`}>{m}</button> :
              <span className="text-muted">{m}</span>}
              </th>
            )}
            <th scope="col" className="w-12 py-1 text-right font-medium text-muted">Total</th>
          </tr>
        </thead>
        <tbody>
          {years.map((y) => {
            const cov = coverage.get(y);
            let rowTotal = 0;
            return (
              <tr key={y}>
                <th scope="row" className="py-0.5 text-left font-mono font-normal text-muted">{y}</th>
                {MONTHS_SHORT.map((_, m) => {
                  const covered = !!cov && m >= cov.first && m <= cov.last;
                  const n = grid.get(`${y}-${m}`) ?? 0;
                  rowTotal += n;
                  return (
                    <td key={m} className="px-0.5 py-0.5">
                      <div
                        className={`flex h-7 items-center justify-center rounded tabular-nums ${selectedMonth === m ? 'ring-1 ring-primary' : ''}`}
                        style={covered ? { background: n ? heatColor(n / max) : '#f3f5f8', color: n ? heatText(n / max) : '#111827', fontWeight: 600 } : { background: '#ffffff', border: '1px dashed #dee3e9', color: '#9aa3ae' }}
                        title={covered ? `${MONTHS[m]} ${y}: ${n} siniestros` : `${MONTHS[m]} ${y}: sin cobertura de datos`}>
                        
                        {covered ? n || '·' : '—'}
                      </div>
                    </td>);

                })}
                <td className="py-0.5 text-right font-semibold tabular-nums">{rowTotal}</td>
              </tr>);

          })}
        </tbody>
      </table>
      <div className="mt-2 flex max-w-xs items-center gap-2 text-[11px] text-muted"><span>Menos</span><span className="h-2 flex-1 rounded-full" style={{ background: HEAT_GRADIENT_CSS }} /><span>Más</span></div>
      <p className="mt-1 text-[11px] text-muted">Unidad: siniestros fatales por mes. Celdas con borde punteado (—): meses fuera de la cobertura de la base (no equivalen a cero).</p>
    </div>);

}