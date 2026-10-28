import type { Filters, PriorityCategory, SiniestroView } from '../types/data';
import { franjas } from './parsing';

export const emptyFilters: Filters = {
  yearFrom: null, yearTo: null, provincia: null, distrito: null, via: null, clase: null, causa: null,
  tipoVehiculo: null, tipoUsuario: null, franja: null, gravedad: null, prioridad: null, tipoZona: null
};

export function applyFilters(views: SiniestroView[], f: Filters): SiniestroView[] {
  return views.filter((v) => {
    if (f.yearFrom !== null && (v.anio === null || v.anio < f.yearFrom)) return false;
    if (f.yearTo !== null && (v.anio === null || v.anio > f.yearTo)) return false;
    if (f.provincia && v.provincia !== f.provincia) return false;
    if (f.distrito && v.distrito !== f.distrito) return false;
    if (f.via && v.via !== f.via) return false;
    if (f.clase && v.clase !== f.clase) return false;
    if (f.causa && v.causa !== f.causa) return false;
    if (f.tipoVehiculo && !v.tiposVehiculo.includes(f.tipoVehiculo)) return false;
    if (f.tipoUsuario && !v.tiposUsuario.includes(f.tipoUsuario)) return false;
    if (f.franja && v.franja !== f.franja) return false;
    if (f.gravedad === 'uno' && v.fallecidos !== 1) return false;
    if (f.gravedad === 'multiple' && (v.fallecidos === null || v.fallecidos < 2)) return false;
    if (f.gravedad === 'con_lesionados' && (v.lesionados === null || v.lesionados < 1)) return false;
    if (f.prioridad && v.zoneCategory !== f.prioridad) return false;
    if (f.tipoZona === 'concentracion' && !v.zoneId) return false;
    if (f.tipoZona === 'aislado' && (v.zoneId || v.coordStatus !== 'valida')) return false;
    return true;
  });
}

const uniq = (arr: (string | null)[]) => Array.from(new Set(arr.filter((x): x is string => !!x))).sort((a, b) => a.localeCompare(b, 'es'));

export interface FilterOptions {
  years: number[];
  provincias: string[];
  distritos: string[];
  vias: string[];
  clases: string[];
  causas: string[];
  tiposVehiculo: string[];
  tiposUsuario: string[];
  franjas: string[];
  prioridades: PriorityCategory[];
  hasFallecidos: boolean;
  hasLesionados: boolean;
  hasZones: boolean;
}

export function filterOptions(views: SiniestroView[], provincia: string | null): FilterOptions {
  const order: PriorityCategory[] = ['muy_alta', 'alta', 'media', 'baja'];
  const present = new Set(views.map((v) => v.zoneCategory).filter(Boolean));
  const presentFranjas = new Set(views.map((v) => v.franja));
  return {
    years: Array.from(new Set(views.map((v) => v.anio).filter((x): x is number => x !== null))).sort((a, b) => a - b),
    provincias: uniq(views.map((v) => v.provincia)),
    distritos: uniq(views.filter((v) => !provincia || v.provincia === provincia).map((v) => v.distrito)),
    vias: uniq(views.map((v) => v.via)),
    clases: uniq(views.map((v) => v.clase)),
    causas: uniq(views.map((v) => v.causa)),
    tiposVehiculo: uniq(views.flatMap((v) => v.tiposVehiculo)),
    tiposUsuario: uniq(views.flatMap((v) => v.tiposUsuario)),
    franjas: franjas.filter((f) => presentFranjas.has(f)),
    prioridades: order.filter((o) => present.has(o)),
    hasFallecidos: views.some((v) => v.fallecidos !== null),
    hasLesionados: views.some((v) => v.lesionados !== null),
    hasZones: views.some((v) => v.zoneId !== null)
  };
}

export function activeFilterCount(f: Filters): number {
  return Object.values(f).filter((v) => v !== null).length;
}