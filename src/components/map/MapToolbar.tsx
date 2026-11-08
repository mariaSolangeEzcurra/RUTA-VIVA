import React, { useState } from 'react';
import { ChevronDownIcon, CircleDotIcon, FlameIcon, LayersIcon, MapIcon, SlidersHorizontalIcon, TargetIcon } from 'lucide-react';
import type { ColorBy, MapMode } from './AccidentMap';
import { QuarterChips } from '../filters/QuarterChips';
import type { Quarter } from '../../utils/quarters';
import { BASEMAPS } from './basemaps';

interface MapToolbarProps {
  mode: MapMode;
  onMode: (m: MapMode) => void;
  colorBy: ColorBy;
  onColorBy: (c: ColorBy) => void;
  trimestre: Quarter | null;
  onTrimestre: (q: Quarter | null) => void;
  basemap: string;
  onBasemap: (id: string) => void;
  leading?: React.ReactNode;
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; icon?: React.ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-xl bg-canvas p-1" role="radiogroup" aria-label={label}>
      {options.map((o) =>
      <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-150 ${value === o.value ? 'bg-surface text-primary shadow-[0_1px_3px_rgba(15,42,61,0.18)]' : 'text-muted hover:text-ink'}`}>
          {o.icon}{o.label}
        </button>
      )}
    </div>);
}

const Group = ({ label, children }: { label: string; children: React.ReactNode }) =>
  <div className="flex flex-col gap-1">
    <span className="pl-1 text-[11px] font-semibold text-muted">{label}</span>
    {children}
  </div>;

/** Barra superior del mapa: qué ver, trimestre, color de puntos y mapa base, en una sola fila ordenada. */
export function MapToolbar({ mode, onMode, colorBy, onColorBy, trimestre, onTrimestre, basemap, onBasemap, leading }: MapToolbarProps) {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 640);
  return (
    <div className="pointer-events-auto flex max-w-full flex-wrap items-end gap-x-5 gap-y-3 rounded-2xl border border-line/80 bg-surface/95 px-3 py-3 shadow-[0_12px_32px_-14px_rgba(15,42,61,0.35)] backdrop-blur sm:px-4">
      {leading}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 self-end rounded-xl bg-canvas px-3 text-xs font-bold text-ink sm:hidden">
        <SlidersHorizontalIcon className="h-4 w-4 text-primary" /> Opciones
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <>
      <Group label="Ver en el mapa">
        <Segmented label="Ver en el mapa" value={mode} onChange={onMode} options={[
        { value: 'zonas', label: 'Zonas', icon: <TargetIcon className="h-3.5 w-3.5" /> },
        { value: 'puntos', label: 'Puntos', icon: <CircleDotIcon className="h-3.5 w-3.5" /> },
        { value: 'calor', label: 'Calor', icon: <FlameIcon className="h-3.5 w-3.5" /> },
        { value: 'ambos', label: 'Ambos', icon: <LayersIcon className="h-3.5 w-3.5" /> }]} />
      </Group>
      <Group label="Trimestre">
        <div className="w-[250px]"><QuarterChips value={trimestre} onChange={onTrimestre} size="sm" /></div>
      </Group>
      {(mode === 'puntos' || mode === 'ambos') &&
      <Group label="Color de los puntos">
          <Segmented label="Color de los puntos" value={colorBy} onChange={onColorBy} options={[
        { value: 'prioridad', label: 'Prioridad' },
        { value: 'trimestre', label: 'Trimestre' }]} />
        </Group>
      }
      <Group label="Mapa base">
        <label className="relative inline-flex h-10 items-center rounded-xl bg-canvas pl-8 pr-2">
          <MapIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" />
          <select value={basemap} onChange={(e) => onBasemap(e.target.value)} aria-label="Mapa base" className="h-full bg-transparent pr-1 text-xs font-semibold text-ink focus:outline-none">
            {BASEMAPS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </label>
      </Group>
      </>}
    </div>);
}
