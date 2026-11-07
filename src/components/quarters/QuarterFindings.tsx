import React from 'react';
import { AlertTriangleIcon, ArrowDownRightIcon, ArrowUpRightIcon, InfoIcon } from 'lucide-react';
import type { Quarter, QuarterFinding } from '../../utils/quarters';

const tones = {
  down: { icon: ArrowDownRightIcon, bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-500', title: 'text-emerald-800' },
  up: { icon: ArrowUpRightIcon, bg: 'bg-rose-50', border: 'border-rose-200', iconBg: 'bg-rose-500', title: 'text-rose-800' },
  warn: { icon: AlertTriangleIcon, bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-500', title: 'text-amber-900' },
  info: { icon: InfoIcon, bg: 'bg-sky-50', border: 'border-sky-200', iconBg: 'bg-sky-500', title: 'text-sky-900' }
};

export function QuarterFindings({ findings, onSelect }: { findings: QuarterFinding[]; onSelect: (p: { year: number; q: Quarter }) => void }) {
  if (!findings.length) return <p className="py-6 text-center text-xs text-muted">Se necesitan al menos dos años con datos para generar hallazgos.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {findings.map((f, i) => {
        const t = tones[f.tone];
        const Icon = t.icon;
        const body =
          <>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${t.iconBg}`}><Icon className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${t.title}`}>{f.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink/80">{f.text}</span>
            </span>
          </>;
        return (
          <li key={i}>
            {f.period ?
            <button type="button" onClick={() => onSelect(f.period as { year: number; q: Quarter })} className={`flex h-full w-full items-start gap-3 rounded-xl border p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${t.bg} ${t.border}`}>{body}</button> :
            <div className={`flex h-full items-start gap-3 rounded-xl border p-3 ${t.bg} ${t.border}`}>{body}</div>}
          </li>);
      })}
    </ul>);
}
