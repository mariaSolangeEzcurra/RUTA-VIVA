import React from 'react';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import type { Quarter, QuarterProfile } from '../../utils/quarters';
import { quarterInfo } from '../../utils/quarters';

/** Cuatro tarjetas, una por trimestre: promedio anual, peso y comparación con el promedio. Al tocar, filtra. */
export function QuarterCards({ profile, active, onToggle }: { profile: QuarterProfile[]; active: Quarter | null; onToggle: (q: Quarter) => void }) {
  const maxShare = Math.max(0.01, ...profile.map((p) => p.share));
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {profile.map((p) => {
        const info = quarterInfo[p.q];
        const diff = p.index !== null ? Math.round((p.index - 1) * 100) : null;
        const isActive = active === p.q;
        return (
          <button key={p.q} type="button" onClick={() => onToggle(p.q)} aria-pressed={isActive}
            className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${isActive ? 'shadow-md' : 'border-transparent'}`}
            style={{ background: `linear-gradient(135deg, ${info.soft}, #ffffff 70%)`, borderColor: isActive ? info.color : undefined }}>
            <span className="absolute right-0 top-0 h-full w-1.5" style={{ background: info.color }} />
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: info.color }}>{info.short}</span>
              <span className="text-[11px] font-medium text-muted">{info.months}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-ink sm:text-3xl">{p.mean !== null ? p.mean.toFixed(1) : '—'}</p>
            <p className="text-[11px] text-muted">siniestros por año (promedio)</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.share / maxShare) * 100}%`, background: info.color }} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 text-[11px]">
              <span className="text-muted">{Math.round(p.share * 100)} % del total<span className="hidden sm:inline"> · {p.total}</span></span>
              {diff !== null &&
              <span className={`inline-flex items-center gap-0.5 whitespace-nowrap font-semibold ${diff > 5 ? 'text-fatal' : diff < -5 ? 'text-ok' : 'text-muted'}`}>
                  {diff > 5 ? <TrendingUpIcon className="h-3 w-3" /> : diff < -5 ? <TrendingDownIcon className="h-3 w-3" /> : null}
                  {diff > 0 ? '+' : ''}{diff} %
                </span>
              }
            </div>
          </button>);
      })}
    </div>);
}
