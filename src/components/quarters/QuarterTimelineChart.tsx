import React, { useMemo } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, ErrorBar, Legend, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Projection, Quarter, QuarterPoint } from '../../utils/quarters';
import { periodKey, quarterInfo } from '../../utils/quarters';

interface Row {
  key: string;
  label: string;
  year: number;
  q: Quarter;
  real: number | null;
  parcial: boolean;
  media: number | null;
  proy: number | null;
  valor: number | null;
  esProy: boolean;
  err: [number, number] | null;
  low: number | null;
  high: number | null;
}

interface Props {
  series: QuarterPoint[];
  projection: Projection | null;
  selected: { year: number; q: Quarter } | null;
  onSelect: (p: { year: number; q: Quarter }) => void;
  height?: number;
}

/** Serie trimestral real + promedio móvil de 4 trimestres + proyección con rango probable. */
export function QuarterTimelineChart({ series, projection, selected, onSelect, height = 320 }: Props) {
  const data = useMemo<Row[]>(() => {
    const rows: Row[] = series.map((s, i) => {
      const win = series.slice(Math.max(0, i - 3), i + 1).filter((x) => x.status === 'completo');
      return {
        key: s.key, label: `T${s.q} ${String(s.year).slice(2)}`, year: s.year, q: s.q,
        real: s.count, parcial: s.status === 'parcial',
        media: i >= 3 && win.length === 4 ? win.reduce((a, b) => a + b.count, 0) / 4 : null,
        proy: null, valor: s.count, esProy: false, err: null, low: null, high: null
      };
    });
    projection?.points.forEach((p) => {
      const existing = rows.find((r) => r.key === p.key);
      const vals = { proy: Math.round(p.expected * 10) / 10, err: [Math.max(0, p.expected - p.low), Math.max(0, p.high - p.expected)] as [number, number], low: p.low, high: p.high };
      if (existing) Object.assign(existing, { ...vals, err: null });
      else rows.push({ key: p.key, label: `T${p.q} ${String(p.year).slice(2)}`, year: p.year, q: p.q, real: null, parcial: false, media: null, ...vals, valor: vals.proy, esProy: true });
    });
    return rows;
  }, [series, projection]);

  if (!data.length) return <p className="py-10 text-center text-xs text-muted">Sin registros con fecha.</p>;
  const firstProj = data.find((d) => d.real === null && d.proy !== null);
  const lastRow = data[data.length - 1];
  const selKey = selected ? periodKey(selected.year, selected.q) : null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
          onClick={(e: unknown) => {
            const ev = e as { activePayload?: { payload: Row }[] } | null;
            const r = ev?.activePayload?.[0]?.payload;
            if (r && r.real !== null) onSelect({ year: r.year, q: r.q });
          }}>
          {firstProj &&
          <ReferenceArea x1={firstProj.label} x2={lastRow.label} fill="#7C3AED" fillOpacity={0.06} stroke="#7C3AED" strokeOpacity={0.25} strokeDasharray="4 4"
          label={{ value: `Proyección ${projection?.targetYear ?? ''}`, position: 'insideTop', fill: '#6D28D9', fontSize: 11, fontWeight: 600 }} />
          }
          <CartesianGrid stroke="#e5e9ee" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#576373' }} axisLine={false} tickLine={false} interval={0} angle={-40} textAnchor="end" height={44} />
          <YAxis tick={{ fontSize: 11, fill: '#576373' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#0F2A3D', fillOpacity: 0.05 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as Row;
              return (
                <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold" style={{ color: quarterInfo[r.q].color }}>T{r.q} {r.year} · {quarterInfo[r.q].months}</p>
                  {r.real !== null && <p>Registrados: <b>{r.real}</b>{r.parcial && <span className="text-warn"> (trimestre incompleto)</span>}</p>}
                  {r.media !== null && <p className="text-muted">Promedio móvil 4T: {r.media.toFixed(1)}</p>}
                  {r.proy !== null && <p className="text-[#6D28D9]">Proyección: <b>{r.proy.toFixed(1)}</b> (rango {r.low}–{r.high})</p>}
                  {r.real !== null && <p className="mt-1 text-[10px] text-muted">Toque para ver qué cambió</p>}
                </div>);
            }} />
          <Legend wrapperStyle={{ fontSize: 11 }} payload={[
          { value: 'Siniestros registrados (color = trimestre)', type: 'square', color: '#0891B2' },
          { value: 'Promedio móvil 4 trimestres', type: 'line', color: '#0F2A3D' },
          { value: 'Proyección y rango probable', type: 'square', color: '#A78BFA' }]} />
          <Bar dataKey="valor" name="Siniestros" radius={[4, 4, 0, 0]} maxBarSize={28} cursor="pointer">
            {data.map((d) =>
            <Cell key={d.key} fill={quarterInfo[d.q].color}
            fillOpacity={d.esProy ? 0.28 : d.parcial ? 0.4 : selKey && selKey !== d.key ? 0.55 : 1}
            stroke={selKey === d.key ? '#0F2A3D' : d.esProy ? '#7C3AED' : d.parcial ? quarterInfo[d.q].color : undefined}
            strokeWidth={selKey === d.key ? 2.5 : 1.2} strokeDasharray={d.esProy || d.parcial ? '3 2' : undefined} />
            )}
            <ErrorBar dataKey="err" width={6} strokeWidth={1.5} stroke="#6D28D9" direction="y" />
          </Bar>
          <Line dataKey="media" name="Promedio móvil" stroke="#0F2A3D" strokeWidth={2.5} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>);
}
