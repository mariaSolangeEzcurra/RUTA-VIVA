import React, { useMemo } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SiniestroView } from '../../types/data';
import { computeTotals } from '../../utils/metrics';

export function AnnualChart({ views, height = 280 }: {views: SiniestroView[];height?: number;}) {
  const data = useMemo(() => {
    const years = Array.from(new Set(views.map((v) => v.anio).filter((x): x is number => x !== null))).sort();
    return years.map((y) => {
      const t = computeTotals(views.filter((v) => v.anio === y));
      return { anio: String(y), siniestros: t.siniestros, fallecidos: t.fallecidos, lesionados: t.lesionados };
    });
  }, [views]);
  if (!data.length) return <p className="py-10 text-center text-xs text-muted">Sin registros con año para el conjunto actual.</p>;
  const hasL = data.some((d) => d.lesionados !== null);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#e5e9ee" vertical={false} />
        <XAxis dataKey="anio" tick={{ fontSize: 11, fill: '#576373' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#576373' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#dee3e9' }} formatter={(v: unknown, n: unknown) => [typeof v === 'number' ? v.toLocaleString('es-PE') : 'Sin dato', String(n)]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="siniestros" name="Siniestros fatales" fill="#155E75" radius={[3, 3, 0, 0]} maxBarSize={44} />
        <Line dataKey="fallecidos" name="Fallecidos" stroke="#BE1228" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        {hasL && <Line dataKey="lesionados" name="Lesionados" stroke="#B45309" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} connectNulls={false} />}
      </ComposedChart>
    </ResponsiveContainer>);

}