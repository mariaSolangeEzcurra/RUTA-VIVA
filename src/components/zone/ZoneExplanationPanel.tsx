import React from 'react';
import type { AnalysisSnapshot, Zone } from '../../types/data';
import type { ZoneExplanation } from '../../utils/explain';
import { criteriaDefs } from '../../data/ipivConfig';
import { Panel } from '../ui/Panel';

export function ZoneExplanationPanel({ zone, explanation, snapshot }: {zone: Zone;explanation: ZoneExplanation;snapshot: AnalysisSnapshot;}) {
  return (
    <Panel title="Patrón dominante y explicación" subtitle={`Periodo analizado ${explanation.period} · generado por reglas sobre resultados calculados`}>
      <p className={`text-base font-medium ${explanation.patternReliable ? 'text-ink' : 'text-muted'}`}>{explanation.pattern}</p>
      <ul className="mt-3 grid gap-1.5 text-sm text-ink">
        {explanation.evidence.map((e) => <li key={e} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />{e}</li>)}
      </ul>
      <p className="mt-4 rounded-md bg-canvas p-3 text-sm leading-relaxed text-ink">{explanation.interpretation}</p>

      <h3 className="mb-2 mt-6 text-xs font-semibold text-ink">Cálculo del IPIV</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead><tr className="border-b border-line text-left text-muted">
            <th scope="col" className="py-1.5 font-medium">Criterio</th><th scope="col" className="py-1.5 font-medium">Evidencia</th>
            <th scope="col" className="py-1.5 text-right font-medium">Normalizado</th><th scope="col" className="py-1.5 text-right font-medium">Peso</th><th scope="col" className="w-40 py-1.5 pl-3 font-medium">Aporte</th>
          </tr></thead>
          <tbody>
            {criteriaDefs.map((c) => {
              const v = zone.criteria[c.key];
              return (
                <tr key={c.key} className="border-b border-line/70 align-top">
                  <th scope="row" className="py-2 pr-2 text-left font-medium">{c.label}</th>
                  <td className="py-2 pr-2 text-muted">{v.detail}</td>
                  <td className="py-2 text-right tabular-nums">{v.normalized === null ? '—' : v.normalized.toFixed(2)}</td>
                  <td className="py-2 text-right tabular-nums">{snapshot.weights[c.key].toFixed(3)}</td>
                  <td className="py-2 pl-3">
                    {v.contribution === null ? <span className="text-muted">Excluido</span> :
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-canvas"><div className="h-1.5 rounded-full bg-navy" style={{ width: `${Math.min(100, v.contribution)}%` }} /></div>
                        <span className="w-8 text-right tabular-nums">{v.contribution.toFixed(1)}</span>
                      </div>
                    }
                  </td>
                </tr>);

            })}
            <tr><th scope="row" className="py-2 text-left font-semibold" colSpan={4}>IPIV</th><td className="py-2 pl-3 text-right font-semibold tabular-nums">{zone.ipiv}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted">IPIV = 100 × Σ(wᵢ·xᵢ) / Σwᵢ sobre criterios con dato. Criterios sin dato se excluyen y los pesos restantes se renormalizan.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold text-ink">Información pendiente de verificación</h3>
          <ul className="grid gap-1 text-sm text-muted">{explanation.pending.map((p) => <li key={p}>• {p}</li>)}</ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold text-ink">Siguiente paso técnico recomendado</h3>
          <p className="text-sm text-ink">{explanation.nextStep}</p>
        </div>
      </div>
    </Panel>);

}