import React, { useState } from 'react';
import { Loader2Icon, PlayIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { runTemporalValidation } from '../../utils/temporalValidation';
import type { TemporalValidation } from '../../utils/temporalValidation';
import { qualityReport } from '../../utils/quality';
import { formatInt, formatPct } from '../../utils/text';
import { Button } from '../ui/Button';

export function TemporalValidationPanel() {
  const { views, state } = useData();
  const [result, setResult] = useState<TemporalValidation | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setResult(runTemporalValidation(views, state.clusterParams, state.weights));
      setRunning(false);
    }, 20);
  };
  const geo = qualityReport(views).components.find((c) => c.key === 'coord')?.value ?? null;
  const minJ = result?.stability.length ? Math.min(...result.stability.map((s) => s.jaccardTop10)) : null;
  const meanJ = result?.stability.length ? result.stability.reduce((s, x) => s + x.jaccardTop10, 0) / result.stability.length : null;

  return (
    <div className="grid gap-5">
      <ol className="grid gap-3 text-sm sm:grid-cols-3">
        {[['2021–2023', 'Construcción del ranking'], ['2024', 'Ajuste metodológico (incluido en la construcción para evaluar 2025)'], ['2025', 'Evaluación temporal final']].map(([y, t]) =>
        <li key={y} className="rounded-md bg-canvas p-3"><p className="font-mono text-xs text-muted">{y}</p><p className="mt-0.5 text-ink">{t}</p></li>
        )}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running || !views.length}>{running ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}Ejecutar validación temporal</Button>
        <span className="text-xs text-muted">Usa los pesos y parámetros vigentes; el ranking se reconstruye solo con siniestros anteriores a 2025.</span>
      </div>
      {!views.length && <p className="text-sm text-muted">No ejecutable: no hay siniestros importados.</p>}
      {result &&
      <div className="grid gap-4">
          <p className={`text-sm font-medium ${result.status === 'ejecutada' ? 'text-ok' : 'text-warn'}`}>{result.status === 'ejecutada' ? 'Validación ejecutada' : 'No ejecutable'} · {result.reason}</p>
          {result.status === 'ejecutada' &&
        <>
              <dl className="grid gap-4 sm:grid-cols-4">
                <div><dt className="text-xs text-muted">Años de construcción</dt><dd className="font-semibold">{result.trainYears.join(', ')}</dd></div>
                <div><dt className="text-xs text-muted">Siniestros de construcción</dt><dd className="font-semibold tabular-nums">{formatInt(result.trainCount)}</dd></div>
                <div><dt className="text-xs text-muted">Siniestros {result.testYear} evaluados</dt><dd className="font-semibold tabular-nums">{formatInt(result.testCount)}</dd></div>
                <div><dt className="text-xs text-muted">Zonas formadas</dt><dd className="font-semibold tabular-nums">{formatInt(result.zones)}</dd></div>
              </dl>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-line text-left text-xs text-muted"><th scope="col" className="py-2 font-medium">Indicador</th><th scope="col" className="py-2 text-right font-medium">Resultado</th></tr></thead>
                <tbody>
                  {result.topK.map((t) =>
              <tr key={t.k} className="border-b border-line/70">
                      <td className="py-2">Siniestros fatales {result.testYear} a ≤ ε de un siniestro de las Top {t.k} ({t.zonesAvailable} zonas disponibles)</td>
                      <td className="py-2 text-right tabular-nums">{formatPct(t.share)} <span className="text-xs text-muted">({t.hits}/{t.total})</span></td>
                    </tr>
              )}
                  <tr className="border-b border-line/70"><td className="py-2">Estabilidad Top 10 ante ±20 % en cada peso (Jaccard mínimo / medio)</td><td className="py-2 text-right tabular-nums">{minJ === null ? 'No calculable' : `${minJ.toFixed(2)} / ${(meanJ as number).toFixed(2)}`}</td></tr>
                  <tr className="border-b border-line/70"><td className="py-2">Calidad de georreferenciación (todos los registros)</td><td className="py-2 text-right tabular-nums">{formatPct(geo)}</td></tr>
                  <tr className="border-b border-line/70"><td className="py-2">Coincidencia con puntos críticos del informe ONSV Arequipa</td><td className="py-2 text-right text-xs text-muted">Pendiente: fuente oficial no incorporada</td></tr>
                  <tr><td className="py-2">Trazabilidad de recomendaciones</td><td className="py-2 text-right text-xs text-muted">100 % por diseño: cada medida cita regla, evidencia y fuente</td></tr>
                </tbody>
              </table>
              <p className="text-[11px] text-muted">La cobertura no es una tasa de acierto predictivo: zonas con mayor extensión cubren más puntos. No hay tramos viales comparables porque no se dispone de red vial verificada. Ejecutado {new Date(result.executedAt).toLocaleString('es-PE')}.</p>
            </>
        }
        </div>
      }
    </div>);

}