import React from 'react';
import { AlertTriangleIcon, LightbulbIcon, SearchIcon, TrendingUpIcon, WrenchIcon } from 'lucide-react';
import type { Insight, InsightKind } from '../../utils/temporal';

const meta: Record<InsightKind, {label: string;icon: React.ReactNode;tone: string;}> = {
  hallazgo: { label: 'Hallazgos', icon: <SearchIcon className="h-3.5 w-3.5" />, tone: 'text-navy' },
  causa: { label: 'Posibles causas según el registro', icon: <LightbulbIcon className="h-3.5 w-3.5" />, tone: 'text-warn' },
  prediccion: { label: 'Expectativa para el periodo', icon: <TrendingUpIcon className="h-3.5 w-3.5" />, tone: 'text-primary' },
  recomendacion: { label: 'Recomendaciones según la temporalidad', icon: <WrenchIcon className="h-3.5 w-3.5" />, tone: 'text-ok' },
  limitacion: { label: 'Limitaciones', icon: <AlertTriangleIcon className="h-3.5 w-3.5" />, tone: 'text-muted' }
};
const order: InsightKind[] = ['hallazgo', 'causa', 'prediccion', 'recomendacion', 'limitacion'];

export function InsightList({ insights }: {insights: Insight[];}) {
  return (
    <div className="grid gap-4">
      {order.map((k) => {
        const items = insights.filter((i) => i.kind === k);
        if (!items.length) return null;
        return (
          <section key={k}>
            <h4 className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${meta[k].tone}`}>{meta[k].icon}{meta[k].label}</h4>
            <ul className="grid gap-2">
              {items.map((i) =>
              <li key={i.title + i.text} className="text-xs leading-relaxed">
                  <span className="font-medium text-ink">{i.title}. </span>
                  <span className="text-muted">{i.text}</span>
                </li>
              )}
            </ul>
          </section>);

      })}
    </div>);

}