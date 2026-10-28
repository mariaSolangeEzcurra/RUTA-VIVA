import React from 'react';
import { CheckCircle2Icon, CircleDashedIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { originalSources } from '../data/sources';
import { datasetLabels } from '../data/fieldSchemas';
import { normalizeText, formatDateTime, formatInt } from '../utils/text';

export function OriginalSourcesStatus() {
  const { state } = useData();
  return (
    <ul className="divide-y divide-line">
      {originalSources.map((s) => {
        const logs = state.imports.filter((i) => i.status !== 'fallida' && i.status !== 'cancelada' && normalizeText(i.fileName) === normalizeText(s.fileName));
        const last = logs[0];
        const sameKind = state.imports.filter((i) => i.kind === s.kind && i.status !== 'fallida' && i.status !== 'cancelada');
        return (
          <li key={s.fileName} className="flex items-start gap-3 py-3">
            {last ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleDashedIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />}
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-ink">{s.fileName}</p>
              <p className="text-xs text-muted">{datasetLabels[s.kind]} · {s.period} · {s.preliminar ? 'preliminar' : 'definitivo'}</p>
              {last ?
              <p className="mt-0.5 text-xs text-ok">Importado {formatDateTime(last.finishedAt)} · {formatInt(last.nuevos)} nuevos de {formatInt(last.read)} leídos</p> :

              <p className="mt-0.5 text-xs text-warn">
                  No accesible en este entorno: no se ha leído ni procesado.
                  {sameKind.length > 0 && ` Existen ${sameKind.length} importación(es) del mismo tipo con otro nombre de archivo.`}
                </p>
              }
            </div>
          </li>);

      })}
    </ul>);

}