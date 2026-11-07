import React, { useMemo, useState } from 'react';
import { ArrowRightIcon, HelpCircleIcon, MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import type { SiniestroView } from '../../types/data';
import type { Quarter, QuarterPoint } from '../../utils/quarters';
import { explainChange, periodLabel, quarterInfo } from '../../utils/quarters';
import { titleCase } from '../../utils/text';

interface Props {
  views: SiniestroView[];
  series: QuarterPoint[];
  selected: { year: number; q: Quarter };
}

type Mode = 'interanual' | 'anterior';

/** Responde "¿por qué subió o bajó?": compara el trimestre elegido con otro y muestra qué categorías explican la diferencia. */
export function ChangeExplainer({ views, series, selected }: Props) {
  const [mode, setMode] = useState<Mode>('interanual');
  const prevQ = selected.q === 1 ? { year: selected.year - 1, q: 4 as Quarter } : { year: selected.year, q: (selected.q - 1) as Quarter };
  const base = mode === 'interanual' ? { year: selected.year - 1, q: selected.q } : prevQ;
  const baseExists = series.some((s) => s.year === base.year && s.q === base.q);
  const cur = series.find((s) => s.year === selected.year && s.q === selected.q);
  const baseSeries = series.find((s) => s.year === base.year && s.q === base.q);
  const r = useMemo(() => explainChange(views, base, selected), [views, base.year, base.q, selected.year, selected.q]); // eslint-disable-line react-hooks/exhaustive-deps
  const down = r.delta < 0;
  const flat = r.delta === 0;
  const color = flat ? '#576373' : down ? '#15803D' : '#BE1228';

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg bg-canvas p-0.5 text-xs font-semibold" role="radiogroup" aria-label="Comparar con">
          {([['interanual', 'vs. mismo trimestre del año anterior'], ['anterior', 'vs. trimestre anterior']] as [Mode, string][]).map(([m, l]) =>
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-md px-2.5 py-1.5 transition-all ${mode === m ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'}`}>{l}</button>
          )}
        </div>
        <p className="text-[11px] text-muted">Recomendado: la comparación interanual descuenta la estacionalidad.</p>
      </div>

      {!baseExists ?
      <p className="rounded-lg bg-canvas px-3 py-4 text-center text-xs text-muted">No hay datos de {periodLabel(base.year, base.q)} para comparar. Elija otro trimestre o cambie el tipo de comparación.</p> :
      <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-gradient-to-r from-canvas to-surface p-4 sm:gap-5">
            <div className="text-center">
              <p className="text-[11px] font-semibold" style={{ color: quarterInfo[base.q].color }}>{periodLabel(base.year, base.q)}</p>
              <p className="text-3xl font-bold tabular-nums text-ink/60">{r.before}</p>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-muted" />
            <div className="text-center">
              <p className="text-[11px] font-semibold" style={{ color: quarterInfo[selected.q].color }}>{periodLabel(selected.year, selected.q)}</p>
              <p className="text-3xl font-bold tabular-nums text-ink">{r.after}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-sm" style={{ background: color }}>
              {flat ? <MinusIcon className="h-4 w-4" /> : down ? <TrendingDownIcon className="h-4 w-4" /> : <TrendingUpIcon className="h-4 w-4" />}
              {r.delta > 0 ? '+' : ''}{r.delta}{r.pct !== null && ` (${r.pct > 0 ? '+' : ''}${Math.round(r.pct * 100)} %)`}
            </div>
            <p className="min-w-[220px] flex-1 text-sm leading-relaxed text-ink">
              <HelpCircleIcon className="mr-1 inline h-4 w-4 align-[-3px]" style={{ color }} />
              {r.sentence}
            </p>
          </div>
          {(cur?.status === 'parcial' || baseSeries?.status === 'parcial') &&
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-[#7a3d06]">Atención: uno de los trimestres está incompleto en la base. Parte de la diferencia puede deberse a meses aún no cargados, no a un cambio real.</p>
        }

          {r.byDim.length > 0 &&
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {r.byDim.map((d) => {
            const maxAbs = Math.max(1, ...d.rows.map((x) => Math.abs(x.delta)));
            return (
              <div key={d.dimension} className="rounded-xl border border-line p-3">
                    <p className="mb-2 text-xs font-semibold text-ink">{d.dimension}</p>
                    <ul className="grid gap-1.5">
                      {d.rows.map((x) =>
                  <li key={x.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
                          <div className="min-w-0">
                            <p className="truncate text-ink" title={titleCase(x.label)}>{titleCase(x.label)} <span className="text-muted">({x.before} → {x.after})</span></p>
                            <div className="mt-0.5 h-1.5 rounded-full bg-canvas">
                              <div className="h-full rounded-full" style={{ width: `${(Math.abs(x.delta) / maxAbs) * 100}%`, background: x.delta < 0 ? '#22C55E' : '#F43F5E' }} />
                            </div>
                          </div>
                          <span className={`w-9 text-right font-bold tabular-nums ${x.delta < 0 ? 'text-ok' : 'text-fatal'}`}>{x.delta > 0 ? '+' : ''}{x.delta}</span>
                        </li>
                  )}
                    </ul>
                  </div>);
          })}
            </div>
        }
          <p className="text-[11px] leading-relaxed text-muted">
            <b>Cómo leerlo:</b> verde = categorías con menos siniestros que antes; rojo = con más. Son las variaciones registradas en la base y ayudan a formular hipótesis (más control, obras, menor tránsito, subregistro de datos preliminares…), pero no prueban la causa por sí solas.
          </p>
        </>
      }
    </div>);
}
