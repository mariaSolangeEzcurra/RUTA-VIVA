import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react';
import type { QuarterPoint, Quarter } from '../../utils/quarters';
import { periodLabel, quarterInfo } from '../../utils/quarters';

interface MapTimelineProps {
  series: QuarterPoint[];
  yearFrom: number | null;
  yearTo: number | null;
  trimestre: Quarter | null;
  onSelect: (year: number, q: Quarter) => void;
  onReset: () => void;
}

/** Línea de tiempo trimestral sobre el mapa: cada barra es un trimestre; al tocarla el mapa muestra solo ese periodo. */
export function MapTimeline({ series, yearFrom, yearTo, trimestre, onSelect, onReset }: MapTimelineProps) {
  const [playing, setPlaying] = useState(false);
  const max = Math.max(1, ...series.map((s) => s.count));
  const single = yearFrom !== null && yearFrom === yearTo && trimestre !== null;
  const selectedIdx = single ? series.findIndex((s) => s.year === yearFrom && s.q === trimestre) : -1;
  const anyPeriod = yearFrom !== null || yearTo !== null || trimestre !== null;
  const inRange = (s: QuarterPoint) => (yearFrom === null || s.year >= yearFrom) && (yearTo === null || s.year <= yearTo) && (trimestre === null || s.q === trimestre);
  const years = useMemo(() => Array.from(new Set(series.map((s) => s.year))), [series]);

  const idxRef = useRef(selectedIdx);
  idxRef.current = selectedIdx;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      const next = idxRef.current + 1;
      if (next >= series.length) { setPlaying(false); return; }
      selectRef.current(series[next].year, series[next].q);
    };
    if (idxRef.current < 0 || idxRef.current >= series.length - 1) {
      selectRef.current(series[0].year, series[0].q);
    }
    const id = window.setInterval(tick, 1500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, series]);

  useEffect(() => {
    if (selectedIdx < 0 || !scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedIdx]);

  if (!series.length) return null;
  const current = selectedIdx >= 0 ? series[selectedIdx] : null;

  return (
    <div className="pointer-events-auto rounded-2xl border border-line bg-surface/95 p-2.5 shadow-[0_10px_30px_-12px_rgba(28,39,49,0.35)] backdrop-blur sm:p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPlaying((p) => !p)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white shadow-sm transition-colors ${playing ? 'bg-fatal hover:bg-fatal/90' : 'bg-primary hover:bg-primary/90'}`}
          aria-label={playing ? 'Pausar animación' : 'Reproducir trimestres en el mapa'}>
          {playing ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
          {playing ? 'Pausar' : 'Reproducir'}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-ink">
            Línea de tiempo por trimestres
            {current && <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] text-white" style={{ background: quarterInfo[current.q].color }}>{periodLabel(current.year, current.q)} · {current.count} siniestros</span>}
          </p>
          <p className="hidden truncate text-[11px] text-muted sm:block">Toque un trimestre para verlo en el mapa. La altura de cada barra es el número de siniestros.</p>
        </div>
        {anyPeriod &&
        <button type="button" onClick={() => { setPlaying(false); onReset(); }} className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-3 text-xs font-medium text-primary hover:bg-canvas">
            <RotateCcwIcon className="h-3 w-3" /> Todo el periodo
          </button>
        }
      </div>
      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-end gap-3">
          {years.map((y) =>
          <div key={y} className="flex flex-col items-center">
              <div className="flex h-14 items-end gap-0.5">
                {series.map((s, i) => s.year !== y ? null :
              <button key={s.key} type="button" data-idx={i} onClick={() => { setPlaying(false); onSelect(s.year, s.q); }}
              title={`${periodLabel(s.year, s.q)} (${quarterInfo[s.q].months}): ${s.count} siniestros${s.status === 'parcial' ? ' · trimestre incompleto' : ''}`}
              aria-label={`${periodLabel(s.year, s.q)}: ${s.count} siniestros`} aria-pressed={i === selectedIdx}
              className={`group relative flex w-6 flex-col items-center justify-end rounded-t-md transition-all duration-200 sm:w-7`}
              style={{ height: '100%' }}>
                    <span className={`mb-0.5 text-[9px] font-semibold tabular-nums group-hover:text-ink ${i === selectedIdx ? 'text-ink' : 'text-muted'}`}>{s.count}</span>
                    <span className="w-full rounded-t-md transition-all duration-200 group-hover:brightness-110"
                style={{
                  height: `${Math.max(6, (s.count / max) * 38)}px`,
                  background: s.status === 'parcial' ? `repeating-linear-gradient(45deg, ${quarterInfo[s.q].color}, ${quarterInfo[s.q].color} 3px, ${quarterInfo[s.q].soft} 3px, ${quarterInfo[s.q].soft} 6px)` : quarterInfo[s.q].color,
                  opacity: anyPeriod && !inRange(s) ? 0.25 : 1,
                  outline: i === selectedIdx ? '2px solid #1C2731' : undefined,
                  outlineOffset: 2
                }} />
                  </button>
              )}
              </div>
              <div className="mt-1 flex w-full gap-0.5">
                {series.filter((s) => s.year === y).map((s) => <span key={s.key} className="w-6 text-center text-[9px] font-medium text-muted sm:w-7">T{s.q}</span>)}
              </div>
              <span className="mt-0.5 font-mono text-[11px] font-semibold text-ink">{y}</span>
            </div>
          )}
        </div>
      </div>
    </div>);
}
