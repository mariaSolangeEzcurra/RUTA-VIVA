import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { QuarterPoint } from '../../utils/quarters';
import { QUARTERS, quarterInfo } from '../../utils/quarters';

const YEAR_COLORS = ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#4338CA', '#312E81'];

/** Agrupado: cada grupo es un trimestre y cada barra un año (compara el mismo trimestre entre años). */
export function QuarterGroupedChart({ series, height = 280 }: { series: QuarterPoint[]; height?: number }) {
  const years = useMemo(() => Array.from(new Set(series.map((s) => s.year))).sort((a, b) => a - b), [series]);
  const colors = years.map((_, i) => YEAR_COLORS[Math.max(0, YEAR_COLORS.length - years.length + i)] ?? '#64748B');
  const data = useMemo(() => QUARTERS.map((q) => {
    const row: Record<string, string | number | null> = { q: `${quarterInfo[q].short} · ${quarterInfo[q].months}` };
    years.forEach((y) => {
      const s = series.find((x) => x.year === y && x.q === q);
      row[String(y)] = s && s.status === 'completo' ? s.count : null;
    });
    return row;
  }), [series, years]);
  if (!series.length) return <p className="py-10 text-center text-xs text-muted">Sin registros con fecha.</p>;
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid stroke="#e5e9ee" vertical={false} />
          <XAxis dataKey="q" tick={{ fontSize: 11, fill: '#576373' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#576373' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: '#0E233D', fillOpacity: 0.04 }} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#dee3e9' }} formatter={(v: unknown, n: unknown) => [v === null || v === undefined ? 'Incompleto' : `${v} siniestros`, String(n)]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {years.map((y, i) => <Bar key={y} dataKey={String(y)} name={String(y)} fill={colors[i]} radius={[3, 3, 0, 0]} maxBarSize={22} />)}
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[11px] text-muted">Los colores van de claro (años antiguos) a intenso (años recientes). Los trimestres incompletos no se dibujan.</p>
    </div>);
}
