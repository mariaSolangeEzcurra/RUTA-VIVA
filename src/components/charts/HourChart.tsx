import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SiniestroView } from '../../types/data';
import { hourOf, isNight } from '../../utils/parsing';

export function HourChart({ views }: {views: SiniestroView[];}) {
  const { data, known } = useMemo(() => {
    const counts = new Array(24).fill(0) as number[];
    let k = 0;
    views.forEach((v) => {
      const h = hourOf(v.hora);
      if (h !== null) {counts[h]++;k++;}
    });
    return { data: counts.map((c, h) => ({ hora: String(h).padStart(2, '0'), siniestros: c, noche: isNight(`${String(h).padStart(2, '0')}:00`) })), known: k };
  }, [views]);
  if (!known) return <p className="py-10 text-center text-xs text-muted">No hay hora registrada en el conjunto actual.</p>;
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#e5e9ee" vertical={false} />
          <XAxis dataKey="hora" tick={{ fontSize: 10, fill: '#576373' }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: '#576373' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} labelFormatter={(l: unknown) => `${String(l)}:00–${String(l)}:59`} />
          <Bar dataKey="siniestros" name="Siniestros" radius={[2, 2, 0, 0]}>
            {data.map((d) => <Cell key={d.hora} fill={d.noche ? '#0E233D' : '#155E75'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[11px] text-muted">Unidad: siniestros por hora de ocurrencia · {known.toLocaleString('es-PE')} de {views.length.toLocaleString('es-PE')} con hora. Barras oscuras: franja nocturna 18:00–05:59.</p>
    </div>);

}