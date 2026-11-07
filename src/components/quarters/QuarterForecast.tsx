import React from 'react';
import { TelescopeIcon } from 'lucide-react';
import type { Projection, QuarterProfile } from '../../utils/quarters';
import { quarterInfo } from '../../utils/quarters';

const confStyle = {
  alta: 'bg-emerald-100 text-emerald-800',
  media: 'bg-amber-100 text-amber-800',
  baja: 'bg-rose-100 text-rose-800',
  insuficiente: 'bg-slate-100 text-slate-700'
};

/** Proyección del siguiente año: total anual y por trimestre, con rango probable y método explicado. */
export function QuarterForecast({ projection, profile }: { projection: Projection | null; profile: QuarterProfile[] }) {
  if (!projection || projection.confidence === 'insuficiente') {
    return <p className="rounded-lg bg-canvas px-3 py-6 text-center text-xs text-muted">Se necesitan al menos 4 trimestres completos para proyectar el siguiente año.</p>;
  }
  const p = projection;
  const maxHigh = Math.max(1, ...p.target.map((t) => t.high));
  const vsLast = p.lastFullYear && p.lastFullYear.count > 0 ? (p.annual.expected - p.lastFullYear.count) / p.lastFullYear.count : null;
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,280px)_1fr]">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 p-4 text-white shadow-md">
          <TelescopeIcon className="absolute -right-3 -top-3 h-20 w-20 text-white/10" />
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Proyección {p.targetYear}</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{Math.round(p.annual.expected)}</p>
          <p className="text-xs text-white/85">siniestros fatales esperados en el año</p>
          <p className="mt-2 rounded-md bg-white/15 px-2 py-1 text-xs">Rango probable: <b>{p.annual.low} – {p.annual.high}</b></p>
          {vsLast !== null && p.lastFullYear &&
          <p className="mt-2 text-xs text-white/90">{vsLast < 0 ? '▼' : '▲'} {Math.abs(Math.round(vsLast * 100))} % frente a {p.lastFullYear.year} ({p.lastFullYear.count} registrados)</p>
          }
          <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${confStyle[p.confidence]}`}>Confianza {p.confidence}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {p.target.map((t) => {
            const info = quarterInfo[t.q];
            return (
              <div key={t.key} className="flex flex-col rounded-xl border-2 border-dashed p-3" style={{ borderColor: `${info.color}88`, background: `${info.soft}66` }}>
                <div className="flex items-center justify-between">
                  <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: info.color }}>{info.short} {p.targetYear}</span>
                  <span className="text-[10px] text-muted">{info.months}</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-ink">{t.expected.toFixed(0)}</p>
                <p className="text-[11px] text-muted">esperados · rango {t.low}–{t.high}</p>
                {(() => {
                  const hist = profile.find((x) => x.q === t.q)?.mean ?? null;
                  if (hist === null || hist === 0) return null;
                  const d = Math.round(((t.expected - hist) / hist) * 100);
                  return <p className="mb-2 mt-1 text-[11px] text-ink/80">Promedio histórico: <b>{hist.toFixed(1)}</b> <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${d < 0 ? 'bg-emerald-100 text-emerald-800' : d > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>{d > 0 ? '+' : ''}{d} %</span></p>;
                })()}
                <div className="relative mt-auto h-2 rounded-full bg-white pt-0">
                  <div className="absolute inset-y-0 rounded-full opacity-40" style={{ left: `${(t.low / maxHigh) * 100}%`, width: `${Math.max(2, ((t.high - t.low) / maxHigh) * 100)}%`, background: info.color }} />
                  <div className="absolute inset-y-[-2px] w-1 rounded-full" style={{ left: `${(t.expected / maxHigh) * 100}%`, background: info.color }} />
                </div>
              </div>);
          })}
        </div>
      </div>
      <details className="rounded-lg border border-line bg-canvas/60 px-3 py-2 text-xs text-muted">
        <summary className="cursor-pointer font-semibold text-ink">¿Cómo se calcula la proyección?</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">
          <li>Se calcula el peso típico de cada trimestre (estacionalidad): {([1, 2, 3, 4] as const).map((q) => `T${q} ×${p.seasonal[q].toFixed(2)}`).join(' · ')}.</li>
          <li>Se quita ese efecto y se ajusta una tendencia lineal sobre {p.usedQuarters} trimestres completos ({p.trendPerYear !== null ? `${p.trendPerYear > 0 ? '+' : ''}${Math.round(p.trendPerYear * 100)} % por año` : 'sin tendencia'}; se limita a ±25 % anual).</li>
          <li>Se prolonga la tendencia y se vuelve a aplicar la estacionalidad. El rango probable es el intervalo 10 %–90 % de un modelo de Poisson.</li>
        </ol>
        <p className="mt-2">Es una expectativa estadística que supone que las condiciones se mantienen; no considera obras, operativos ni cambios en el registro. Con datos preliminares, conviene recalcularla cuando se carguen los definitivos.</p>
      </details>
    </div>);
}
