import React from 'react';
import { CircleDotIcon, FlameIcon, LayersIcon } from 'lucide-react';
import type { ColorBy, MapMode } from './AccidentMap';
import { QuarterChips } from '../filters/QuarterChips';
import type { Quarter } from '../../utils/quarters';

interface MapToolbarProps {
  mode: MapMode;
  onMode: (m: MapMode) => void;
  colorBy: ColorBy;
  onColorBy: (c: ColorBy) => void;
  trimestre: Quarter | null;
  onTrimestre: (q: Quarter | null) => void;
}

function Segmented<T extends string>({ value, options, onChange, disabled }: { value: T; options: { value: T; label: string; icon?: React.ReactNode }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className={`inline-flex rounded-lg bg-canvas p-0.5 ${disabled ? 'opacity-40' : ''}`} role="radiogroup">
      {options.map((o) =>
      <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled} onClick={() => onChange(o.value)}
      className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-all duration-150 ${value === o.value ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-ink'}`}>
          {o.icon}{o.label}
        </button>
      )}
    </div>);
}

/** Controles rápidos del mapa: tipo de vista, color de los puntos y trimestre. */
export function MapToolbar({ mode, onMode, colorBy, onColorBy, trimestre, onTrimestre }: MapToolbarProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-end gap-x-4 gap-y-2 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-lg backdrop-blur">
      <div>
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Vista</p>
        <Segmented value={mode} onChange={onMode} options={[
        { value: 'puntos', label: 'Puntos', icon: <CircleDotIcon className="h-3 w-3" /> },
        { value: 'calor', label: 'Calor', icon: <FlameIcon className="h-3 w-3" /> },
        { value: 'ambos', label: 'Ambos', icon: <LayersIcon className="h-3 w-3" /> }]} />
      </div>
      <div>
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Color de puntos</p>
        <Segmented value={colorBy} onChange={onColorBy} disabled={mode === 'calor'} options={[
        { value: 'prioridad', label: 'Prioridad' },
        { value: 'trimestre', label: 'Trimestre' }]} />
      </div>
      <div className="w-[230px]">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Trimestre</p>
        <QuarterChips value={trimestre} onChange={onTrimestre} size="sm" />
      </div>
    </div>);
}
