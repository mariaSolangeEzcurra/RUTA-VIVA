import React from 'react';
import { CheckCircle2Icon, Loader2Icon, RefreshCwIcon, XCircleIcon } from 'lucide-react';
import type { ConflictPolicy, DatasetKind } from '../../types/data';
import { useImportWizard } from '../../hooks/useImportWizard';
import type { WizardStep } from '../../hooks/useImportWizard';
import { useData } from '../../contexts/DataContext';
import { datasetLabels } from '../../data/fieldSchemas';
import { formatInt } from '../../utils/text';
import type { ImportScope, WideMetric } from '../../utils/importValidation';
import { Button } from '../ui/Button';
import { FileDropzone } from './FileDropzone';
import { SheetPreview } from './SheetPreview';
import { ColumnMapper } from './ColumnMapper';
import { ValidationSummary } from './ValidationSummary';

const steps: {key: WizardStep;label: string;}[] = [
{ key: 'archivos', label: 'Archivos' }, { key: 'mapeo', label: 'Hoja y columnas' }, { key: 'validacion', label: 'Validación' }, { key: 'resultado', label: 'Resultado' }];


const policies: {value: ConflictPolicy;label: string;hint: string;}[] = [
{ value: 'conservar', label: 'Conservar existentes', hint: 'No modifica registros existentes; todas las diferencias quedan como conflictos para revisar.' },
{ value: 'completar', label: 'Completar vacíos', hint: 'Solo rellena campos sin dato; las diferencias con valor quedan como conflictos.' },
{ value: 'sobrescribir', label: 'Sobrescribir con el archivo', hint: 'Regla explícita: el valor entrante reemplaza al existente y se registra el valor anterior.' }];


const input = 'h-9 w-full rounded-md border border-line bg-surface px-2 text-sm';

export function ImportWizard() {
  const w = useImportWizard();
  const { reprocess, processing } = useData();
  const { draft, currentSheet, validation, step } = w;
  const idx = steps.findIndex((s) => s.key === step);
  const missingRequired = draft && currentSheet ? false : true;

  return (
    <div className="grid gap-5">
      <ol className="flex flex-wrap items-center gap-2 text-xs" aria-label="Pasos de importación">
        {steps.map((s, i) =>
        <li key={s.key} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${i < idx ? 'bg-ok text-white' : i === idx ? 'bg-navy text-white' : 'bg-canvas text-muted'}`} aria-current={i === idx ? 'step' : undefined}>{i + 1}</span>
            <span className={i === idx ? 'font-semibold text-ink' : 'text-muted'}>{s.label}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line" aria-hidden />}
          </li>
        )}
      </ol>

      <FileDropzone files={w.files} activeId={draft?.fileId ?? null} onAdd={w.addFiles} onSelect={w.selectFile} onRemove={w.removeFile} />

      {draft && currentSheet && w.currentFile && step !== 'resultado' &&
      <section className="grid gap-5 rounded-lg border border-line p-4" aria-label="Configuración de la importación">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="sheet" className="mb-1 block text-xs font-medium text-muted">Hoja a procesar</label>
              <select id="sheet" value={draft.sheetName} onChange={(e) => w.setSheet(e.target.value)} className={input}>
                {w.currentFile.workbook?.sheets.map((s) => <option key={s.name} value={s.name}>{s.name}{s.empty ? ' (vacía)' : ` · ${s.rows.length} filas`}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="kind" className="mb-1 block text-xs font-medium text-muted">Tipo de fuente <span className="font-normal">(detección {draft.detection.confidence})</span></label>
              <select id="kind" value={draft.kind} onChange={(e) => w.setKind(e.target.value as DatasetKind)} className={input}>
                {(Object.keys(datasetLabels) as DatasetKind[]).map((k) => <option key={k} value={k}>{datasetLabels[k]}{k === draft.detection.kind ? ' · detectado' : ''}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="scope" className="mb-1 block text-xs font-medium text-muted">Ámbito de importación</label>
              <select id="scope" value={draft.scope} onChange={(e) => w.update({ scope: e.target.value as ImportScope })} className={input} disabled={draft.kind === 'historico'}>
                <option value="region">Solo región Arequipa (piloto)</option>
                <option value="pais">Todo el registro</option>
              </select>
            </div>
            <div>
              <label htmlFor="src" className="mb-1 block text-xs font-medium text-muted">Fuente declarada</label>
              <input id="src" value={draft.declaredSource} onChange={(e) => w.update({ declaredSource: e.target.value })} className={input} />
            </div>
            <div>
              <label htmlFor="period" className="mb-1 block text-xs font-medium text-muted">Periodo de los datos</label>
              <input id="period" value={draft.period} onChange={(e) => w.update({ period: e.target.value })} placeholder="p. ej. 2021-2025" className={input} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={draft.preliminar} onChange={(e) => w.update({ preliminar: e.target.checked })} className="accent-[rgb(21,94,117)]" />
              Datos preliminares
            </label>
          </div>
          {draft.kind === 'historico' && currentSheet.yearColumns.length >= 3 &&
        <div className="grid gap-3 rounded-md bg-canvas p-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.wide} onChange={(e) => w.update({ wide: e.target.checked })} className="accent-[rgb(21,94,117)]" />
                Formato ancho: los años están en columnas ({currentSheet.yearColumns.length} detectados)
              </label>
              {draft.wide &&
          <div className="flex items-center gap-2">
                  <label htmlFor="metric" className="whitespace-nowrap text-xs text-muted">Los valores representan</label>
                  <select id="metric" value={draft.wideMetric} onChange={(e) => w.update({ wideMetric: e.target.value as WideMetric })} className={input}>
                    <option value="siniestros">Siniestros</option><option value="fallecidos">Fallecidos</option><option value="lesionados">Lesionados</option>
                  </select>
                </div>
          }
            </div>
        }
          <SheetPreview sheet={currentSheet} mapped={new Set(Object.values(draft.mapping).filter(Boolean) as string[])} />
          <div>
            <h3 className="mb-2 text-sm font-semibold">Correspondencia de columnas</h3>
            <ColumnMapper kind={draft.kind} headers={currentSheet.headers} mapping={draft.mapping} onChange={(m) => w.update({ mapping: m })} hideFields={draft.wide ? ['anio', 'siniestros', 'fallecidos', 'lesionados'] : []} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={w.runValidation} disabled={w.busy || missingRequired || currentSheet.empty}>{w.busy && step === 'mapeo' ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}Validar archivo</Button>
            <Button variant="ghost" onClick={() => void w.cancel()}>Cancelar</Button>
          </div>
        </section>
      }

      {step === 'validacion' && validation && draft &&
      <section className="grid gap-4 rounded-lg border border-line p-4" aria-label="Resultado de la validación">
          <h3 className="text-sm font-semibold">Validación previa · {datasetLabels[validation.kind]}</h3>
          <ValidationSummary v={validation} label={draft.importId} />
          {!validation.blocking && (validation.toInsert.length > 0 || validation.conflicts.length > 0) &&
        <fieldset className="grid gap-2">
              <legend className="mb-1 text-xs font-medium text-muted">Regla para registros existentes con valores distintos</legend>
              <div className="grid gap-2 md:grid-cols-3">
                {policies.map((p) =>
            <label key={p.value} className={`cursor-pointer rounded-md border p-3 text-xs ${draft.policy === p.value ? 'border-primary bg-primary-soft/50' : 'border-line'}`}>
                    <span className="flex items-center gap-2 font-semibold text-ink"><input type="radio" name="policy" checked={draft.policy === p.value} onChange={() => w.update({ policy: p.value })} className="accent-[rgb(21,94,117)]" />{p.label}</span>
                    <span className="mt-1 block text-muted">{p.hint}</span>
                  </label>
            )}
              </div>
            </fieldset>
        }
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button onClick={() => void w.confirm()} disabled={w.busy || !!validation.blocking || validation.toInsert.length === 0 && validation.conflicts.length === 0}>
              {w.busy && <Loader2Icon className="h-4 w-4 animate-spin" />}Confirmar importación ({formatInt(validation.toInsert.length)} nuevos{validation.conflicts.length ? `, ${validation.conflicts.length} con diferencias` : ''})
            </Button>
            <Button variant="secondary" onClick={() => w.setStep('mapeo')}>Volver a columnas</Button>
            <Button variant="ghost" onClick={() => void w.cancel()}>Cancelar importación</Button>
            <span className="text-xs text-muted">Los rechazados no se incorporan y quedan registrados en el informe.</span>
          </div>
        </section>
      }

      {step === 'resultado' && w.result &&
      <section className="rounded-lg border border-line p-4" aria-label="Resultado de la importación">
          <div className="flex items-start gap-3">
            {w.result.status === 'fallida' ? <XCircleIcon className="h-5 w-5 shrink-0 text-fatal" /> : <CheckCircle2Icon className="h-5 w-5 shrink-0 text-ok" />}
            <div className="flex-1">
              <p className="text-sm font-semibold">{w.result.status === 'fallida' ? 'La importación falló. No se aplicó ningún cambio.' : `Importación aplicada · datos v${w.result.dataVersion}`}</p>
              <p className="mt-1 text-xs text-muted">{w.result.id} · {formatInt(w.result.nuevos)} nuevos · {formatInt(w.result.actualizados)} actualizados · {formatInt(w.result.duplicados)} duplicados · {formatInt(w.result.rechazados)} rechazados · {formatInt(w.result.conflictos)} conflictos registrados</p>
              {w.result.errors.map((e) => <p key={e} className="mt-1 text-xs text-fatal">{e}</p>)}
              <div className="mt-4 flex flex-wrap gap-2">
                {w.result.status !== 'fallida' && <Button onClick={() => void reprocess()} disabled={processing}>{processing ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />}Ejecutar reprocesamiento de análisis</Button>}
                <Button variant="secondary" onClick={w.restart}>Importar otro archivo</Button>
              </div>
            </div>
          </div>
        </section>
      }
    </div>);

}