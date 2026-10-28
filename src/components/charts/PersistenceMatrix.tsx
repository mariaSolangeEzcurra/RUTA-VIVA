import React from 'react';
import { Link } from 'react-router-dom';
import type { SiniestroView, Zone } from '../../types/data';
import { categoryHex } from '../../data/ipivConfig';

interface PersistenceMatrixProps {
  zones: Zone[];
  years: number[];
  views: SiniestroView[];
}

/** Persistencia de concentraciones: siniestros por zona y año. */
export function PersistenceMatrix({ zones, years, views }: PersistenceMatrixProps) {
  if (!zones.length) return <p className="py-6 text-center text-xs text-muted">Sin concentraciones en el conjunto actual.</p>;
  const byCode = new Map(views.map((v) => [v.codigo, v]));
  const max = Math.max(1, ...zones.flatMap((z) => years.map((y) => z.memberCodes.filter((c) => byCode.get(c)?.anio === y).length)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-xs">
        <thead>
          <tr className="text-muted">
            <th scope="col" className="py-1.5 pr-2 text-left font-medium">Zona</th>
            {years.map((y) => <th key={y} scope="col" className="px-1 py-1.5 text-center font-medium">{y}</th>)}
            <th scope="col" className="py-1.5 pl-2 text-right font-medium">Años</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) =>
          <tr key={z.id} className="border-t border-line">
              <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                <Link to={`/zona/${encodeURIComponent(z.id)}`} className="inline-flex items-center gap-1.5 text-primary">
                  <span className="h-2 w-2 rounded-full" style={{ background: categoryHex[z.category] }} aria-hidden />
                  <span className="font-mono">#{z.rank}</span>
                </Link>
              </th>
              {years.map((y) => {
              const n = z.memberCodes.filter((c) => byCode.get(c)?.anio === y).length;
              return (
                <td key={y} className="px-1 py-1">
                    <div className="mx-auto flex h-6 w-full min-w-[28px] items-center justify-center rounded text-[11px] tabular-nums" style={{ background: n ? `rgba(190,18,40,${0.12 + 0.75 * n / max})` : '#f3f5f8', color: n / max > 0.5 ? '#fff' : '#111827' }}>
                      {n || '·'}
                    </div>
                  </td>);

            })}
              <td className="py-1.5 pl-2 text-right tabular-nums">{z.years.length}</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted">Unidad: siniestros fatales por año dentro de cada concentración.</p>
    </div>);

}