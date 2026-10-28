import React, { useRef, useState } from 'react';
import { AlertCircleIcon, CheckCircle2Icon, FileSpreadsheetIcon, Loader2Icon, Trash2Icon, UploadCloudIcon } from 'lucide-react';
import type { FileEntry } from '../../hooks/useImportWizard';
import { formatBytes } from '../../utils/text';
import { MAX_FILE_BYTES } from '../../data/fieldSchemas';

interface FileDropzoneProps {
  files: FileEntry[];
  activeId: string | null;
  onAdd: (files: FileList) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function FileDropzone({ files, activeId, onAdd, onSelect, onRemove }: FileDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="grid gap-4">
      <div
        onDragOver={(e) => {e.preventDefault();setOver(true);}}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {e.preventDefault();setOver(false);if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);}}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors duration-150 ease-out ${over ? 'border-primary bg-primary-soft' : 'border-line bg-canvas/50'}`}>
        
        <UploadCloudIcon className="h-7 w-7 text-muted" aria-hidden />
        <p className="mt-2 text-sm font-medium text-ink">Arrastre archivos Excel aquí</p>
        <p className="text-xs text-muted">.xlsx o .xls · uno o varios · máximo {MAX_FILE_BYTES / 1024 / 1024} MB por archivo · no se ejecutan macros ni fórmulas</p>
        <button type="button" onClick={() => input.current?.click()} className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-primary/90">Seleccionar archivos</button>
        <input ref={input} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" multiple className="sr-only" onChange={(e) => {if (e.target.files?.length) onAdd(e.target.files);e.target.value = '';}} />
      </div>
      {files.length > 0 &&
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {files.map((f) =>
        <li key={f.id} className={`flex items-start gap-3 px-3 py-3 ${activeId === f.id ? 'bg-primary-soft/60' : ''}`}>
              <FileSpreadsheetIcon className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">{f.file.name}</p>
                <p className="text-xs text-muted">
                  {formatBytes(f.file.size)}{f.workbook && ` · ${f.workbook.format.toUpperCase()} · ${f.workbook.sheets.length} hoja(s): ${f.workbook.sheets.map((s) => `${s.name}${s.empty ? ' (vacía)' : ` (${s.rows.length.toLocaleString('es-PE')} filas)`}`).join(', ')}`}
                </p>
                {f.status === 'leyendo' && <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted"><Loader2Icon className="h-3 w-3 animate-spin" />Leyendo libro…</p>}
                {f.status === 'error' && <p className="mt-1 inline-flex items-center gap-1 text-xs text-fatal"><AlertCircleIcon className="h-3 w-3" />{f.error}</p>}
                {f.status === 'importado' && <p className="mt-1 inline-flex items-center gap-1 text-xs text-ok"><CheckCircle2Icon className="h-3 w-3" />Importado en esta sesión</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {(f.status === 'listo' || f.status === 'importado') &&
            <button type="button" onClick={() => onSelect(f.id)} className="h-8 whitespace-nowrap rounded-md border border-line bg-surface px-3 text-xs font-medium hover:bg-canvas">{activeId === f.id ? 'Seleccionado' : 'Procesar'}</button>
            }
                <button type="button" onClick={() => onRemove(f.id)} aria-label={`Quitar ${f.file.name}`} className="rounded p-2 text-muted hover:bg-canvas hover:text-fatal"><Trash2Icon className="h-4 w-4" /></button>
              </div>
            </li>
        )}
        </ul>
      }
    </div>);

}