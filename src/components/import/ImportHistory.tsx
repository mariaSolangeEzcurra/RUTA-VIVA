import React, { useState } from 'react';
import { ChevronDownIcon, DownloadIcon } from 'lucide-react';
import type { ImportLog, ImportStatus } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { datasetLabels } from '../../data/fieldSchemas';
import { downloadCsv } from '../../utils/download';
import { formatBytes, formatDateTime, formatInt } from '../../utils/text';

const statusStyle: Record<ImportStatus, string> = {
  completada: 'bg-ok/10 text-ok',
  completada_con_observaciones: 'bg-amber-100 text-[#7a3d06]',
  fallida: 'bg-fatal/10 text-fatal',
  cancelada: 'bg-canvas text-muted'
};
const statusText: Record<ImportStatus, string> = { completada: 'Completada', completada_con_observaciones: 'Con observaciones', fallida: 'Fallida', cancelada: 'Cancelada' };

function report(log: ImportLog) {
  const base = { importacion: log.id, archivo: log.fileName, hoja: log.sheet };
  const summary = Object.entries({ tipo: log.kind, fuente: log.declaredSource, periodo: log.period ?? '', preliminar: log.preliminar, inicio: log.startedAt, fin: log.finishedAt, leidos: log.read, nuevos: log.nuevos, actualizados: log.actualizados, duplicados: log.duplicados, rechazados: log.rechazados, pendientes: log.pendientes, fuera_ambito: log.fueraAmbito, conflictos: log.conflictos, estado: log.status, version_datos: log.dataVersion ?? '' }).
  map(([k, v]) => ({ ...base, registro: '', severidad: 'resumen', campo: k, mensaje: String(v) }));
  const mapping = Object.entries(log.mapping).map(([k, v]) => ({ ...base, registro: '', severidad: 'correspondencia', campo: k, mensaje: v ?? 'sin relacionar' }));
  const msgs = [...log.warnings.map((w) => ({ ...base, registro: '', severidad: 'aviso', campo: '', mensaje: w })), ...log.errors.map((w) => ({ ...base, registro: '', severidad: 'error general', campo: '', mensaje: w }))];
  const issues = log.issuesSample.map((i) => ({ ...base, registro: i.row, severidad: i.severity, campo: i.field ?? '', mensaje: i.message }));
  downloadCsv([...summary, ...mapping, ...msgs, ...issues], `informe_${log.id}.csv`);
}

export function ImportHistory() {
  const { state } = useData();
  const [open, setOpen] = useState<string | null>(null);
  if (!state.imports.length) return <p className="py-6 text-center text-sm text-muted">Aún no se ha realizado ninguna importación.</p>;
  return (
    <ul className="divide-y divide-line">
      {state.imports.map((l) =>
      <li key={l.id} className="py-3">
          <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} aria-expanded={open === l.id} className="flex w-full items-start gap-3 text-left">
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium">{l.fileName} <span className="font-normal text-muted">· hoja {l.sheet}</span></p>
              <p className="text-xs text-muted">{formatDateTime(l.finishedAt)} · {datasetLabels[l.kind]} · {formatInt(l.read)} leídos · {formatInt(l.nuevos)} nuevos · {formatInt(l.actualizados)} actualizados · {formatInt(l.rechazados)} rechazados</p>
            </div>
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle[l.status]}`}>{statusText[l.status]}</span>
            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted transition-transform duration-150 ease-out ${open === l.id ? 'rotate-180' : ''}`} />
          </button>
          {open === l.id &&
        <div className="mt-3 grid gap-3 rounded-md bg-canvas p-3 text-xs">
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['Identificador', l.id], ['Fuente declarada', l.declaredSource], ['Periodo', l.period ?? 'No declarado'], ['Tamaño', formatBytes(l.fileSize)], ['Duplicados', formatInt(l.duplicados)], ['Pendientes', formatInt(l.pendientes)], ['Conflictos', formatInt(l.conflictos)], ['Fuera de ámbito', formatInt(l.fueraAmbito)], ['Versión de datos', l.dataVersion ? `v${l.dataVersion}` : 'Sin cambios'], ['Preliminar', l.preliminar ? 'Sí' : 'No'], ['Usuario', 'Sin autenticación (uso local)']].map(([k, v]) =>
            <div key={k}><dt className="text-muted">{k}</dt><dd className="break-all font-medium">{v}</dd></div>
            )}
              </dl>
              {l.errors.length > 0 && <ul className="text-fatal">{l.errors.map((e) => <li key={e}>• {e}</li>)}</ul>}
              {l.warnings.length > 0 && <ul className="text-[#7a3d06]">{l.warnings.map((e) => <li key={e}>• {e}</li>)}</ul>}
              <button type="button" onClick={() => report(l)} className="inline-flex items-center gap-1 self-start font-medium text-primary"><DownloadIcon className="h-3.5 w-3.5" />Descargar informe ({l.issuesSample.length} incidencias registradas)</button>
            </div>
        }
        </li>
      )}
    </ul>);

}