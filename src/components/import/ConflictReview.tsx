import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';

export function ConflictReview() {
  const { state, resolveConflict } = useData();
  const pending = state.conflicts.filter((c) => c.resolution === 'pendiente');
  const resolved = state.conflicts.length - pending.length;
  if (!state.conflicts.length) return <p className="py-4 text-center text-sm text-muted">No hay conflictos entre fuentes registrados.</p>;
  return (
    <div>
      <p className="mb-3 text-xs text-muted">{pending.length} pendientes · {resolved} resueltos. Aplicar un valor entrante crea una nueva versión de datos.</p>
      {pending.length === 0 ? <p className="text-sm text-ok">Todos los conflictos han sido revisados.</p> :
      <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="sticky top-0 bg-surface text-left text-muted"><tr>
              <th scope="col" className="py-1.5 font-medium">Registro</th><th scope="col" className="py-1.5 font-medium">Campo</th><th scope="col" className="py-1.5 font-medium">Existente</th><th scope="col" className="py-1.5 font-medium">Entrante</th><th scope="col" className="py-1.5" />
            </tr></thead>
            <tbody>
              {pending.slice(0, 200).map((c) =>
            <tr key={c.id} className="border-t border-line align-middle">
                  <td className="py-1.5 pr-2"><span className="font-mono">{c.key}</span><span className="block text-[10px] text-muted">{c.kind} · {c.importId}</span></td>
                  <td className="py-1.5 pr-2">{c.field}</td>
                  <td className="py-1.5 pr-2">{c.existing}</td>
                  <td className="py-1.5 pr-2">{c.incoming}</td>
                  <td className="py-1.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => void resolveConflict(c.id, false)}>Conservar</Button>
                      <Button size="sm" variant="secondary" onClick={() => void resolveConflict(c.id, true)}>Aplicar</Button>
                    </div>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }
    </div>);

}