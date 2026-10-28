import React, { useState } from 'react';
import { Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { ImportWizard } from '../components/import/ImportWizard';
import { ImportHistory } from '../components/import/ImportHistory';
import { ConflictReview } from '../components/import/ConflictReview';
import { DerivedFilesPanel } from '../components/import/DerivedFilesPanel';
import { OriginalSourcesStatus } from '../components/OriginalSourcesStatus';
import { formatDateTime, formatInt } from '../utils/text';

export function DataManagement() {
  const { state, views, reprocess, processing, resetAll, stale } = useData();
  const [confirmReset, setConfirmReset] = useState(false);
  const a = state.analysis;
  const counts = [
  ['Siniestros (todos los ámbitos)', state.siniestros.length],
  ['Siniestros región piloto', views.length],
  ['Personas', state.personas.length],
  ['Vehículos', state.vehiculos.length],
  ['Filas históricas', state.historico.length]] as
  const;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <PageHeader title="Gestión de datos" description="Importe archivos Excel, revise la validación antes de incorporar cambios y actualice los análisis. Los datos importados se conservan en este navegador; no es necesario volver a cargarlos." />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid min-w-0 gap-6">
          <Panel title="Importar archivos Excel"><ImportWizard /></Panel>
          <Panel title="Historial de importaciones" subtitle={`${state.imports.length} operaciones registradas`}><ImportHistory /></Panel>
          <Panel title="Conflictos entre fuentes"><ConflictReview /></Panel>
        </div>
        <aside className="grid content-start gap-6">
          <Panel title="Base actual" subtitle={state.dataVersion ? `Versión de datos v${state.dataVersion} · ${formatDateTime(state.lastProcessedAt)}` : 'Sin datos'}>
            <dl className="grid gap-2 text-sm">
              {counts.map(([l, n]) => <div key={l} className="flex justify-between gap-2"><dt className="text-muted">{l}</dt><dd className="font-semibold tabular-nums">{formatInt(n)}</dd></div>)}
            </dl>
          </Panel>
          <Panel title="Reprocesamiento de análisis">
            <p className="text-sm">
              {a ? <>Último análisis: datos v{a.dataVersion}, {formatDateTime(a.ranAt)} · {a.zones.length} concentraciones.</> : 'El análisis aún no se ha ejecutado.'}
            </p>
            {stale && <p className="mt-2 text-xs text-warn">Pendiente de actualización. Mientras tanto se conserva el último resultado válido, identificado con su versión.</p>}
            <p className="mt-2 text-xs text-muted">Actualiza concentraciones, ranking IPIV, explicaciones, recomendaciones y fichas. Indicadores y gráficos se recalculan automáticamente tras cada importación confirmada.</p>
            <Button className="mt-3" onClick={() => void reprocess()} disabled={processing || !views.length}>
              {processing ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />}Ejecutar reprocesamiento
            </Button>
          </Panel>
          <Panel title="Fuentes originales"><OriginalSourcesStatus /></Panel>
          <Panel title="Archivos derivados"><DerivedFilesPanel /></Panel>
          <Panel title="Reiniciar base local">
            <p className="text-xs text-muted">Elimina de este navegador todos los datos importados, el historial, los análisis y el seguimiento. Los archivos originales no se ven afectados.</p>
            {confirmReset ?
            <div className="mt-3 flex gap-2">
                <Button variant="danger" size="sm" onClick={() => {void resetAll();setConfirmReset(false);}}>Confirmar reinicio</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>Cancelar</Button>
              </div> :
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmReset(true)} disabled={!state.dataVersion && !state.imports.length}>Reiniciar base</Button>}
          </Panel>
        </aside>
      </div>
    </main>);

}