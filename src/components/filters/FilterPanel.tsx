import React, { useMemo } from 'react';
import { CalendarRangeIcon, ChevronDownIcon, RotateCcwIcon } from 'lucide-react';
import type { Filters, PriorityCategory } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { activeFilterCount, filterOptions } from '../../utils/filters';
import { categoryLabel } from '../../data/ipivConfig';
import { titleCase } from '../../utils/text';
import { FilterSelect } from './FilterSelect';
import { QuarterChips } from './QuarterChips';
import type { Quarter } from '../../utils/quarters';

const toOpts = (arr: string[]) => arr.map((v) => ({ value: v, label: titleCase(v) }));

export function FilterPanel({ compact = false }: {compact?: boolean;}) {
  const { views, filters, setFilters, resetFilters, filtered } = useData();
  const o = useMemo(() => filterOptions(views, filters.provincia), [views, filters.provincia]);
  const set = <K extends keyof Filters,>(k: K, v: Filters[K]) => setFilters({ ...filters, [k]: v });
  const count = activeFilterCount(filters);
  const advancedActive = [filters.via, filters.clase, filters.causa, filters.tipoVehiculo, filters.tipoUsuario, filters.franja, filters.gravedad, filters.prioridad, filters.tipoZona].some((x) => x !== null);
  const years = o.years.map((y) => ({ value: String(y), label: String(y) }));

  if (!views.length) {
    return <p className="text-sm text-muted">Los filtros aparecerán cuando existan siniestros importados de la región piloto.</p>;
  }

  return (
    <div className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-2 lg:grid-cols-1'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          <span className="font-semibold text-ink">{filtered.length.toLocaleString('es-PE')}</span> de {views.length.toLocaleString('es-PE')} siniestros
        </p>
        <button type="button" onClick={resetFilters} disabled={count === 0} className="inline-flex items-center gap-1 text-xs font-medium text-primary disabled:text-muted">
          <RotateCcwIcon className="h-3 w-3" /> Limpiar ({count})
        </button>
      </div>
      {years.length > 0 &&
      <fieldset className="grid gap-2 rounded-xl border border-primary/20 bg-primary-soft/50 p-3">
          <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold text-primary"><CalendarRangeIcon className="h-3.5 w-3.5" />Periodo</legend>
          <div className="grid grid-cols-2 gap-2">
            <FilterSelect id="f-y1" label="Desde (año)" value={filters.yearFrom?.toString() ?? null} options={years} onChange={(v) => set('yearFrom', v ? Number(v) : null)} />
            <FilterSelect id="f-y2" label="Hasta (año)" value={filters.yearTo?.toString() ?? null} options={years} onChange={(v) => set('yearTo', v ? Number(v) : null)} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted">Trimestre</p>
            <QuarterChips value={filters.trimestre as Quarter | null} onChange={(q) => set('trimestre', q)} />
          </div>
        </fieldset>
      }
      {o.provincias.length > 0 && <FilterSelect id="f-prov" label="Provincia" value={filters.provincia} options={toOpts(o.provincias)} allLabel="Todas" onChange={(v) => setFilters({ ...filters, provincia: v, distrito: null })} />}
      {o.distritos.length > 0 && <FilterSelect id="f-dist" label="Distrito" value={filters.distrito} options={toOpts(o.distritos)} onChange={(v) => set('distrito', v)} />}
      <details className="group rounded-xl border border-line" open={advancedActive}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-bold text-ink">
          <span>Más filtros <span className="font-normal text-muted">(vía, tipo, causa, vehículo, horario…)</span></span>
          <ChevronDownIcon className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 border-t border-line p-3">
      {o.vias.length > 0 && <FilterSelect id="f-via" label="Carretera / ruta" value={filters.via} options={o.vias.map((v) => ({ value: v, label: v }))} allLabel="Todas" onChange={(v) => set('via', v)} />}
      {o.clases.length > 0 && <FilterSelect id="f-clase" label="Tipo de siniestro" value={filters.clase} options={toOpts(o.clases)} onChange={(v) => set('clase', v)} />}
      {o.causas.length > 0 && <FilterSelect id="f-causa" label="Causa registrada" value={filters.causa} options={toOpts(o.causas)} allLabel="Todas" onChange={(v) => set('causa', v)} />}
      {o.tiposVehiculo.length > 0 && <FilterSelect id="f-veh" label="Tipo de vehículo" value={filters.tipoVehiculo} options={toOpts(o.tiposVehiculo)} onChange={(v) => set('tipoVehiculo', v)} />}
      {o.tiposUsuario.length > 0 && <FilterSelect id="f-usr" label="Tipo de usuario vial" value={filters.tipoUsuario} options={toOpts(o.tiposUsuario)} onChange={(v) => set('tipoUsuario', v)} />}
      {o.franjas.length > 0 && <FilterSelect id="f-fr" label="Franja horaria" value={filters.franja} options={o.franjas.map((f) => ({ value: f, label: f }))} allLabel="Todas" onChange={(v) => set('franja', v)} />}
      {(o.hasFallecidos || o.hasLesionados) &&
      <FilterSelect id="f-grav" label="Consecuencia" value={filters.gravedad} allLabel="Todas"
      options={[...(o.hasFallecidos ? [{ value: 'uno', label: '1 fallecido' }, { value: 'multiple', label: '2 o más fallecidos' }] : []), ...(o.hasLesionados ? [{ value: 'con_lesionados', label: 'Con lesionados' }] : [])]}
      onChange={(v) => set('gravedad', v as Filters['gravedad'])} />
      }
      {o.prioridades.length > 0 && <FilterSelect id="f-prio" label="Categoría de prioridad" value={filters.prioridad} allLabel="Todas" options={o.prioridades.map((p: PriorityCategory) => ({ value: p, label: categoryLabel[p] }))} onChange={(v) => set('prioridad', v as PriorityCategory | null)} />}
      {o.hasZones &&
      <FilterSelect id="f-zona" label="Tipo de ubicación" value={filters.tipoZona} allLabel="Todas"
      options={[{ value: 'concentracion', label: 'En concentración' }, { value: 'aislado', label: 'Siniestro aislado' }]}
      onChange={(v) => set('tipoZona', v as Filters['tipoZona'])} />
      }
        </div>
      </details>
    </div>);

}