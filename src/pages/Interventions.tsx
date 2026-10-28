import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLinkIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { interventionCatalog, RECOMMENDATION_DISCLAIMER, technicalReferences } from '../data/interventionCatalog';
import { recommendForZone } from '../utils/recommend';

const triggerRule: Record<string, string> = {
  atropello_nocturno: '≥ 2 atropellos y ≥ 40 % de los siniestros con clase; ≥ 50 % nocturnos con al menos 3 horas registradas.',
  atropello: '≥ 2 atropellos y ≥ 40 % de los siniestros con clase.',
  choque: '≥ 2 choques y ≥ 40 % de los siniestros con clase (si no aplica la regla frontal).',
  choque_frontal: '≥ 2 siniestros frontales y ≥ 30 % de los siniestros con clase.',
  despiste: '≥ 2 despistes y ≥ 40 % de los siniestros con clase.',
  volcadura_pesados: '≥ 2 volcaduras (≥ 30 %) y ≥ 50 % de siniestros con vehículos pesados vinculados.',
  motociclistas: '≥ 40 % de siniestros evaluables con motocicletas o trimotos (mínimo 3 evaluables).',
  entorno_escolar: 'No evaluable sin capa verificada de centros educativos.',
  sin_patron: 'Se aplica cuando ninguna otra regla alcanza el umbral.'
};

export function Interventions() {
  const { state } = useData();
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    state.analysis?.zones.forEach((z) => recommendForZone(z).forEach((r) => m.set(r.measure.id, (m.get(r.measure.id) ?? 0) + 1)));
    return m;
  }, [state.analysis]);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <PageHeader title="Catálogo de intervenciones" description="Reglas explícitas que vinculan un patrón observado con medidas candidatas, condiciones de aplicación y fuentes técnicas. Las medidas se activan por zona en el detalle de cada zona." />
      <p role="note" className="mt-5 rounded-md border border-fatal/25 bg-fatal/5 px-3 py-2 text-sm font-medium text-fatal">{RECOMMENDATION_DISCLAIMER}</p>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Patrón y regla de activación</th>
                <th scope="col" className="px-4 py-2 font-medium">Medida candidata y condiciones</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Zonas</th>
              </tr>
            </thead>
            <tbody>
              {interventionCatalog.map((m) =>
              <tr key={m.id} className="border-t border-line align-top">
                  <td className="w-[38%] px-4 py-4">
                    <p className="font-semibold text-ink">{m.pattern}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted">{m.id}</p>
                    <p className="mt-2 text-xs text-muted">{triggerRule[m.trigger]}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-ink">{m.measure}</p>
                    <p className="mt-2 text-xs text-muted"><span className="font-medium text-ink">Condiciones:</span> {m.conditions}</p>
                    <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">Limitaciones:</span> {m.limitations}</p>
                    <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">Indicadores de resultado:</span> {m.outcomeIndicators.join('; ')}</p>
                    <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">Fuentes:</span> {m.references.map((id) => technicalReferences.find((t) => t.id === id)?.publisher).join(' · ')}</p>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">{state.analysis ? counts.get(m.id) ?? 0 : <span className="text-xs text-muted">—</span>}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <aside className="grid content-start gap-6">
          <Panel title="Referencias técnicas">
            <ul className="grid gap-3">
              {technicalReferences.map((r) =>
              <li key={r.id} className="text-xs">
                  <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 font-medium text-primary hover:underline">{r.title}<ExternalLinkIcon className="mt-0.5 h-3 w-3 shrink-0" /></a>
                  <p className="text-muted">{r.publisher} · {r.year}</p>
                </li>
              )}
            </ul>
          </Panel>
          <Panel title="Cómo se usa">
            <p className="text-xs text-muted">Abra una zona desde el <Link to="/ranking" className="text-primary">ranking IPIV</Link>: verá las reglas que se activaron con su evidencia y podrá registrarlas en Seguimiento. El registro nunca aprueba ni ejecuta una medida automáticamente.</p>
          </Panel>
        </aside>
      </div>
    </main>);

}