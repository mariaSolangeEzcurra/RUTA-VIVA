import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string | null;
  options: Option[];
  onChange: (v: string | null) => void;
  allLabel?: string;
}

export function FilterSelect({ id, label, value, options, onChange, allLabel = 'Todos' }: FilterSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className={`h-9 w-full rounded-md border bg-surface px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 ${value ? 'border-primary' : 'border-line'}`}>
        
        <option value="">{allLabel}</option>
        {options.map((o) =>
        <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>);

}