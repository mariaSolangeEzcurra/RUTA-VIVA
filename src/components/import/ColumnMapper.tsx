import React from 'react';
import type { DatasetKind } from '../../types/data';
import { fieldSchemas } from '../../data/fieldSchemas';
import { sensitiveHeaders } from '../../utils/excel';

interface ColumnMapperProps {
  kind: DatasetKind;
  headers: string[];
  mapping: Record<string, string | null>;
  onChange: (mapping: Record<string, string | null>) => void;
  hideFields?: string[];
}

export function ColumnMapper({ kind, headers, mapping, onChange, hideFields = [] }: ColumnMapperProps) {
  const sensitive = new Set(sensitiveHeaders(headers));
  const usable = headers.filter((h) => !sensitive.has(h));
  const fields = fieldSchemas[kind].filter((f) => !hideFields.includes(f.key));
  return (
    <div>
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {fields.map((f) => {
          const value = mapping[f.key];
          const missing = f.required && !value;
          return (
            <div key={f.key} className="grid grid-cols-[1fr_1.1fr] items-center gap-2">
              <label htmlFor={`map-${f.key}`} className="text-xs">
                <span className={missing ? 'font-semibold text-fatal' : 'text-ink'}>{f.label}</span>
                {f.required && <span className="text-fatal"> *</span>}
              </label>
              <select
                id={`map-${f.key}`}
                value={value ?? ''}
                onChange={(e) => onChange({ ...mapping, [f.key]: e.target.value || null })}
                className={`h-8 w-full rounded-md border bg-surface px-2 text-xs ${missing ? 'border-fatal' : value ? 'border-primary/50' : 'border-line'}`}>
                
                <option value="">— Sin relacionar —</option>
                {usable.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>);

        })}
      </div>
      {sensitive.size > 0 && <p className="mt-3 text-[11px] text-muted">No se pueden relacionar por contener datos personales: {Array.from(sensitive).join(', ')}.</p>}
    </div>);

}