import React, { useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoricoRow } from '../../types/data';
import { titleCase } from '../../utils/text';

export function HistoricalChart({ rows }: {rows: HistoricoRow[];}) {
  const ambitos = useMemo(() => Array.from(new Set(rows.map((r) => r.ambito))).sort(), [rows]);
  const preferred = ambitos.find((a) => a.includes('AREQUIPA')) ?? ambitos[0] ?? '';
  const [ambito, setAmbito] = useState(preferred);
  const current = ambitos.includes(ambito) ? ambito : preferred;
  const data = useMemo(() => rows.filter((r) => r.ambito === current).sort((a, b) => a.anio - b.anio).map((r) => ({ anio: String(r.anio), siniestros: r.siniestros, fallecidos: r.fallecidos, lesionados: r.lesionados })), [rows, current]);
  const has = (k: 'siniestros' | 'fallecidos' | 'lesionados') => data.some((d) => d[k] !== null);

  return (
    <div>
      {ambitos.length > 1 &&
      <div className="mb-3 flex items-center gap-2">
          <label htmlFor="hist-amb" className="text-xs text-muted">Ámbito</label>
          <select id="hist-amb" value={current} onChange={(e) => setAmbito(e.target.value)} className="h-8 rounded-md border border-line bg-surface px-2 text-xs">
            {ambitos.map((a) => <option key={a} value={a}>{titleCase(a)}</option>)}
          </select>
        </div>
      }
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
          <CartesianGrid stroke="#e5e9ee" vertical={false} />
          <XAxis dataKey="anio" tick={{ fontSize: 11, fill: '#576373' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#576373' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toLocaleString('es-PE')} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: unknown, n: unknown) => [typeof v === 'number' ? v.toLocaleString('es-PE') : 'Sin dato', String(n)]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {has('siniestros') && <Line dataKey="siniestros" name="Siniestros (todos)" stroke="#155E75" strokeWidth={2} dot={false} connectNulls={false} />}
          {has('fallecidos') && <Line dataKey="fallecidos" name="Fallecidos" stroke="#BE1228" strokeWidth={2} dot={false} connectNulls={false} />}
          {has('lesionados') && <Line dataKey="lesionados" name="Lesionados" stroke="#B45309" strokeWidth={2} dot={false} connectNulls={false} />}
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-muted">Estadística agregada anual. No contiene registros individuales y no es comparable directamente con la base de siniestros fatales 2021–2025.</p>
    </div>);

}