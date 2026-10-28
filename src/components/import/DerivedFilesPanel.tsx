import React from 'react';
import { DownloadIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { derivedFiles } from '../../utils/exports';
import { downloadJson } from '../../utils/download';

export function DerivedFilesPanel() {
  const { state, views } = useData();
  const files = derivedFiles(state, views);
  return (
    <div>
      <ul className="divide-y divide-line">
        {files.map((f) =>
        <li key={f.name} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-ink">{f.name}</p>
              <p className="text-[11px] text-muted">{f.description}</p>
            </div>
            <button type="button" disabled={!f.available} onClick={() => downloadJson(f.build(), f.name)} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary disabled:text-muted" aria-label={`Descargar ${f.name}`}>
              <DownloadIcon className="h-3.5 w-3.5" />{f.available ? 'Descargar' : 'Sin datos'}
            </button>
          </li>
        )}
      </ul>
      <p className="mt-2 text-[11px] text-muted">Las versiones .parquet previstas se entregan como JSON equivalente; cada archivo incluye la versión de datos y la fecha de generación.</p>
    </div>);

}