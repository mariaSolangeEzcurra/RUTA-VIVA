import React from 'react';
import type { QualityReport } from '../utils/quality';
import { formatPct } from '../utils/text';

export function QualitySummary({ report, dense = false }: {report: QualityReport;dense?: boolean;}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-xs text-muted">Índice de confianza del dato</p>
        <p className="text-xl font-semibold tabular-nums text-ink">{report.index === null ? <span className="text-sm text-muted">No calculable</span> : formatPct(report.index, 0)}</p>
      </div>
      <ul className={`grid ${dense ? 'gap-1.5' : 'gap-2.5'}`}>
        {report.components.map((c) =>
        <li key={c.key}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-ink" title={c.detail}>{c.label}{!c.inIndex && <span className="text-muted"> (fuera del índice)</span>}</span>
              <span className={`shrink-0 tabular-nums ${c.value === null ? 'text-muted' : 'text-ink'}`}>{c.value === null ? 'No calculable' : formatPct(c.value, 0)}</span>
            </div>
            {c.value !== null &&
          <div className="mt-1 h-1 rounded-full bg-canvas">
                <div className={`h-1 rounded-full ${c.value >= 0.8 ? 'bg-ok' : c.value >= 0.5 ? 'bg-prio-media' : 'bg-fatal'}`} style={{ width: `${c.value * 100}%` }} />
              </div>
          }
          </li>
        )}
      </ul>
      <p className="mt-3 text-[11px] text-muted">
        Promedio simple de {report.components.filter((c) => c.inIndex && c.value !== null).length} componentes calculables sobre {report.n.toLocaleString('es-PE')} registros.
        {report.preliminarShare !== null && ` ${formatPct(report.preliminarShare, 0)} de los registros son preliminares.`} Independiente del IPIV.
      </p>
    </div>);

}