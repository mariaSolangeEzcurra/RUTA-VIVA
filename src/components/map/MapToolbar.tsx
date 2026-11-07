import React from 'react';
import { CircleDotIcon, FlameIcon, LayersIcon, TargetIcon } from 'lucide-react';
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
    <div className={`inline-flex rounded-xl bg-canvas p-0.5 ${disabled ? 'opacity-40' : ''}`} role="radiogroup">
      {options.map((o) =>
      <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled} onClick={() => onChange(o.value)}
      className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-all duration-150 ${value === o.value ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-ink'}`}>
          {o.icon}{o.label}
        </button>
      )}
    </div>);
}

/** Controles rápidos del mapa: tipo de vista, color de los puntos y trimestre. */
export function MapToolbar({ mode, onMode, colorBy, onColorBy, trimestre, onTrimestre }: MapToolbarProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-end gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface/95 px-3.5 py-2.5 shadow-[0_10px_30px_-12px_rgba(28,39,49,0.35)] backdrop-blur">
      <div>
        <p className="mb-1 text-[11px] font-bold text-muted">Ver en el mapa</p>
        <Segmented value={mode} onChange={onMode} options={[
        { value: 'zonas', label: 'Zonas', icon: <TargetIcon className="h-3 w-3" /> },
        { value: 'puntos', label: 'Puntos', icon: <CircleDotIcon className="h-3 w-3" /> },
        { value: 'calor', label: 'Calor', icon: <FlameIcon className="h-3 w-3" /> },
        { value: 'ambos', label: 'Ambos', icon: <LayersIcon className="h-3 w-3" /> }]} />
      </div>
      {(mode === 'puntos' || mode === 'ambos') &&
      <div>
        <p className="mb-1 text-[11px] font-bold text-muted">Color de los puntos</p>
        <Segmented value={colorBy} onChange={onColorBy} options={[
        { value: 'prioridad', label: 'Prioridad' },
        { value: 'trimestre', label: 'Trimestre' }]} />
      </div>}
      <div className="w-[230px]">
        <p className="mb-1 text-[11px] font-bold text-muted">Trimestre</p>
        <QuarterChips value={trimestre} onChange={onTrimestre} size="sm" />
      </div>
    </div>);
}
