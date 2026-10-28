import React from 'react';
import type { ParsedSheet } from '../../utils/excel';

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

export function SheetPreview({ sheet, mapped }: {sheet: ParsedSheet;mapped: Set<string>;}) {
  if (sheet.empty) return <p className="rounded-md bg-canvas px-3 py-6 text-center text-sm text-muted">La hoja “{sheet.name}” está vacía.</p>;
  return (
    <div>
      <p className="mb-2 text-xs text-muted">Encabezado detectado en la fila {sheet.headerRowIndex + 1} · {sheet.headers.length} columnas · {sheet.rows.length.toLocaleString('es-PE')} registros · vista previa de 8 registros</p>
      <div className="max-h-72 overflow-auto rounded-md border border-line">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-canvas">
            <tr>
              {sheet.headers.map((h) =>
              <th key={h} scope="col" className={`whitespace-nowrap border-b border-line px-2 py-1.5 text-left font-medium ${mapped.has(h) ? 'text-primary' : 'text-muted'}`}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.slice(0, 8).map((r, i) =>
            <tr key={i} className="border-b border-line/60">
                {r.map((c, j) => <td key={j} className="whitespace-nowrap px-2 py-1 font-mono">{cell(c)}</td>)}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[11px] text-muted">Columnas en color: relacionadas con un campo interno.</p>
    </div>);

}