import React from 'react';
import { ExternalLinkIcon, PlusIcon } from 'lucide-react';
import type { Recommendation } from '../../utils/recommend';
import { RECOMMENDATION_DISCLAIMER, technicalReferences } from '../../data/interventionCatalog';
import { Button } from '../ui/Button';

interface RecommendationListProps {
  recommendations: Recommendation[];
  registered: string[];
  onRegister?: (r: Recommendation) => void;
}

export function RecommendationList({ recommendations, registered, onRegister }: RecommendationListProps) {
  return (
    <div>
      <p role="note" className="mb-4 rounded-md border border-fatal/25 bg-fatal/5 px-3 py-2 text-xs font-medium text-fatal">{RECOMMENDATION_DISCLAIMER}</p>
      <ol className="grid gap-5">
        {recommendations.map((r) =>
        <li key={r.measure.id} className="border-l-2 border-navy pl-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted">{r.measure.pattern} · <span className="font-mono">{r.measure.id}</span></p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{r.measure.measure}</p>
              </div>
              {onRegister && (
            registered.includes(r.measure.id) ?
            <span className="whitespace-nowrap rounded-full bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary">En seguimiento</span> :
            <Button size="sm" variant="secondary" onClick={() => onRegister(r)}><PlusIcon className="h-3.5 w-3.5" />Registrar en seguimiento</Button>)
            }
            </div>
            <dl className="mt-2 grid gap-1.5 text-xs">
              <div><dt className="inline font-medium text-ink">Evidencia: </dt><dd className="inline text-muted">{r.evidence}</dd></div>
              <div><dt className="inline font-medium text-ink">Condiciones: </dt><dd className="inline text-muted">{r.measure.conditions}</dd></div>
              <div><dt className="inline font-medium text-ink">Limitaciones: </dt><dd className="inline text-muted">{r.measure.limitations}</dd></div>
              <div><dt className="inline font-medium text-ink">Levantar en campo: </dt><dd className="inline text-muted">{r.measure.fieldData.join('; ')}.</dd></div>
              <div>
                <dt className="font-medium text-ink">Fuentes técnicas:</dt>
                <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {r.measure.references.map((id) => {
                  const ref = technicalReferences.find((t) => t.id === id);
                  return ref ? <a key={id} href={ref.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{ref.publisher} ({ref.year})<ExternalLinkIcon className="h-3 w-3" /></a> : null;
                })}
                </dd>
              </div>
            </dl>
          </li>
        )}
      </ol>
      <p className="mt-4 text-[11px] text-muted">No se atribuyen reducciones porcentuales a ninguna medida: su efecto depende de condiciones locales que deben verificarse.</p>
    </div>);

}