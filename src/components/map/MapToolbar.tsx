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
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
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
  <div className="flex items-center gap-2">
    <span className="hidden whitespace-nowrap text-xs font-semibold text-muted 2xl:inline">{label}</span>
    {children}
  </div>;

/** Barra superior del mapa: qué ver, trimestre, color de puntos y mapa base, en una sola fila ordenada. */
export function MapToolbar({ mode, onMode, colorBy, onColorBy, trimestre, onTrimestre, leading, trailing }: MapToolbarProps) {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 640);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line/80 bg-surface px-2.5 py-2">
      {leading}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-canvas px-3 text-xs font-bold text-ink sm:hidden">
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
        <div className="w-[240px]"><QuarterChips value={trimestre} onChange={onTrimestre} size="sm" /></div>
      </Group>
      {(mode === 'puntos' || mode === 'ambos') &&
      <Group label="Color de los puntos">
          <Segmented label="Color de los puntos" value={colorBy} onChange={onColorBy} options={[
        { value: 'prioridad', label: 'Prioridad' },
        { value: 'trimestre', label: 'Trimestre' }]} />
        </Group>
      }
      </>}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>);
}

/** Selector de mapa base (proveedores sin API key). */
export function BasemapPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted">Mapa base</p>
      <div className="grid grid-cols-2 gap-1.5">
        {BASEMAPS.map((b) =>
        <button key={b.id} type="button" onClick={() => onChange(b.id)} aria-pressed={value === b.id}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors ${value === b.id ? 'border-primary bg-primary-soft text-primary' : 'border-line hover:bg-canvas'}`}>
            <MapIcon className="h-3.5 w-3.5 shrink-0" />{b.label}
          </button>
        )}
      </div>
    </div>);
}
