import React, { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import type { ValidationResult } from '../../utils/importValidation';
import { downloadCsv } from '../../utils/download';
import { formatInt } from '../../utils/text';

export function validationReportRows(v: ValidationResult, label: string): Record<string, unknown>[] {
  const summary = [
  ['leidos', v.read], ['nuevos_validos', v.toInsert.length], ['conflictos', v.conflicts.length], ['duplicados_en_archivo', v.duplicadosArchivo],
  ['duplicados_en_base', v.duplicadosExistentes], ['rechazados', v.rechazados], ['pendientes_revision', v.pendientes], ['fuera_de_ambito', v.fueraAmbito]].
  map(([k, n]) => ({ registro: '', severidad: 'resumen', campo: k, mensaje: `${n}`, importacion: label }));
  const warnings = v.warnings.map((w) => ({ registro: '', severidad: 'aviso general', campo: '', mensaje: w, importacion: label }));
  const issues = v.issues.map((i) => ({ registro: i.row, severidad: i.severity, campo: i.field ?? '', mensaje: i.message, importacion: label }));
  const conflicts = v.conflicts.flatMap((c) => c.diffs.map((d) => ({ registro: c.key, severidad: 'conflicto', campo: d.field, mensaje: `existente: ${d.existing} | entrante: ${d.incoming}`, importacion: label })));
  return [...summary, ...warnings, ...issues, ...conflicts];
}

export function ValidationSummary({ v, label }: {v: ValidationResult;label: string;}) {
  const [tab, setTab] = useState<'error' | 'advertencia' | 'conflictos'>('error');
  const stats = [
  { l: 'Leídos', n: v.read, c: 'text-ink' },
  { l: 'Nuevos válidos', n: v.toInsert.length, c: 'text-ok' },
  { l: 'Pendientes de revisión', n: v.pendientes, c: 'text-warn', hint: 'incluidos en nuevos' },
  { l: 'Conflictos con la base', n: v.conflicts.length, c: 'text-warn' },
  { l: 'Duplicados', n: v.duplicadosArchivo + v.duplicadosExistentes, c: 'text-muted', hint: `${v.duplicadosArchivo} en archivo · ${v.duplicadosExistentes} en base` },
  { l: 'Rechazados', n: v.rechazados, c: 'text-fatal' },
  { l: 'Fuera de ámbito', n: v.fueraAmbito, c: 'text-muted' }];

  const errors = v.issues.filter((i) => i.severity === 'error');
  const warns = v.issues.filter((i) => i.severity === 'advertencia');
  const list = tab === 'error' ? errors : warns;

  return (
    <div className="grid gap-4">
      {v.blocking && <p role="alert" className="rounded-md border border-fatal/30 bg-fatal/5 px-3 py-2 text-sm text-fatal">{v.blocking}</p>}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) =>
        <div key={s.l} className="rounded-md bg-canvas px-3 py-2">
            <dt className="text-[11px] text-muted">{s.l}</dt>
            <dd className={`text-lg font-semibold tabular-nums ${s.c}`}>{formatInt(s.n)}</dd>
            {s.hint && <dd className="text-[10px] text-muted">{s.hint}</dd>}
          </div>
        )}
      </dl>
      {v.warnings.length > 0 && <ul className="grid gap-1 text-xs text-[#7a3d06]">{v.warnings.map((w) => <li key={w}>• {w}</li>)}</ul>}
      {v.unmappedColumns.length > 0 && <p className="text-[11px] text-muted">Columnas desconocidas o sin relacionar: {v.unmappedColumns.join(', ')}.</p>}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line">
          <div role="tablist" className="flex gap-1">
            {([['error', `Errores (${errors.length})`], ['advertencia', `Advertencias (${warns.length})`], ['conflictos', `Conflictos (${v.conflicts.length})`]] as const).map(([k, l]) =>
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium ${tab === k ? 'border-primary text-primary' : 'border-transparent text-muted'}`}>{l}</button>
            )}
          </div>
          <button type="button" onClick={() => downloadCsv(validationReportRows(v, label), `informe_validacion_${label}.csv`)} className="inline-flex items-center gap-1 pb-1 text-xs font-medium text-primary"><DownloadIcon className="h-3.5 w-3.5" />Descargar informe de validación</button>
        </div>
        <div className="max-h-64 overflow-auto">
          {tab === 'conflictos' ?
          v.conflicts.length ?
          <table className="w-full text-xs">
                <tbody>
                  {v.conflicts.slice(0, 300).flatMap((c) => c.diffs.map((d) =>
              <tr key={`${c.key}-${d.field}`} className="border-b border-line/60">
                      <td className="py-1.5 pr-2 font-mono">{c.key}</td><td className="py-1.5 pr-2 text-muted">{d.field}</td>
                      <td className="py-1.5 pr-2">{d.existing}</td><td className="py-1.5">→ {d.incoming}{d.fillable && <span className="ml-1 text-ok">(completa un vacío)</span>}</td>
                    </tr>
              ))}
                </tbody>
              </table> :
          <p className="py-4 text-center text-xs text-muted">Sin conflictos con la base existente.</p> :
          list.length ?
          <table className="w-full text-xs">
              <tbody>
                {list.slice(0, 300).map((i, idx) =>
              <tr key={`${i.row}-${idx}`} className="border-b border-line/60">
                    <td className="w-24 py-1.5 pr-2 font-mono text-muted">reg. {i.row}</td>
                    <td className="w-28 py-1.5 pr-2 text-muted">{i.field ?? '—'}</td>
                    <td className="py-1.5">{i.message}</td>
                  </tr>
              )}
              </tbody>
            </table> :
          <p className="py-4 text-center text-xs text-muted">Sin incidencias de este tipo.</p>}
          {list.length > 300 && tab !== 'conflictos' && <p className="py-2 text-center text-[11px] text-muted">Se muestran 300 de {list.length}. El informe descargable contiene todas.</p>}
        </div>
      </div>
    </div>);

}