import type { AnalysisSnapshot, Persona, Siniestro, SiniestroView, StoreState, Vehiculo } from '../types/data';
import { PILOT_REGION } from '../data/fieldSchemas';
import { hourBand, isNight } from './parsing';
import { normalizeText } from './text';

const VULNERABLE_USER = ['PEATON', 'CICLIST', 'MOTOCICL', 'MOTO'];
const MOTO_VEHICLE = ['MOTO', 'TRIMOTO', 'MOTOTAXI'];
const VULNERABLE_VEHICLE = [...MOTO_VEHICLE, 'BICI', 'CICLO'];
const HEAVY_VEHICLE = ['CAMION', 'TRACTO', 'REMOLQUE', 'OMNIBUS', 'BUS', 'CISTERNA', 'VOLQUETE'];

export function isFallecido(cond: string | null): boolean {
  const c = normalizeText(cond);
  return c.includes('FALLEC') || c.includes('MUERT') || c.includes('OCCIS');
}

export function isLesionado(cond: string | null): boolean {
  const c = normalizeText(cond);
  return c.includes('LESION') || c.includes('HERID');
}

const has = (value: string | null, keys: string[]) => {
  const v = normalizeText(value);
  return v !== '' && keys.some((k) => v.includes(k));
};

export function inPilotRegion(s: Siniestro): boolean {
  if (s.departamento) return normalizeText(s.departamento).includes(PILOT_REGION);
  return s.coordStatus === 'valida';
}

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);else
    m.set(k, [it]);
  }
  return m;
}

export function buildView(s: Siniestro, personas: Persona[], vehiculos: Vehiculo[], zone: {id: string;category: SiniestroView['zoneCategory'];} | null): SiniestroView {
  const withCond = personas.filter((p) => p.condicion !== null);
  let fallecidos: number | null = null;
  let fallecidosOrigen: SiniestroView['fallecidosOrigen'] = null;
  let lesionados: number | null = null;
  let lesionadosOrigen: SiniestroView['lesionadosOrigen'] = null;
  if (withCond.length) {
    fallecidos = withCond.filter((p) => isFallecido(p.condicion)).length;
    fallecidosOrigen = 'personas';
    lesionados = withCond.filter((p) => isLesionado(p.condicion)).length;
    lesionadosOrigen = 'personas';
  } else {
    if (s.fallecidosFuente !== null) {fallecidos = s.fallecidosFuente;fallecidosOrigen = 'fuente';}
    if (s.lesionadosFuente !== null) {lesionados = s.lesionadosFuente;lesionadosOrigen = 'fuente';}
  }
  const conteoDiscrepante = fallecidosOrigen === 'personas' && s.fallecidosFuente !== null && s.fallecidosFuente !== fallecidos;

  const userTypes = personas.map((p) => p.tipoUsuario).filter((x): x is string => !!x);
  const vehTypes = vehiculos.map((v) => v.tipo).filter((x): x is string => !!x);
  const ages = personas.map((p) => p.edad).filter((x): x is number => x !== null);
  const hasInfo = userTypes.length > 0 || vehTypes.length > 0 || ages.length > 0;
  const vulnerable = hasInfo ?
  userTypes.some((u) => has(u, VULNERABLE_USER)) || vehTypes.some((v) => has(v, VULNERABLE_VEHICLE)) || ages.some((a) => a < 18 || a >= 65) :
  null;
  const moto = userTypes.length || vehTypes.length ? vehTypes.some((v) => has(v, MOTO_VEHICLE)) || userTypes.some((u) => has(u, ['MOTO'])) : null;
  const pesado = vehTypes.length ? vehTypes.some((v) => has(v, HEAVY_VEHICLE)) : null;

  return {
    ...s,
    personas,
    vehiculos,
    fallecidos,
    fallecidosOrigen,
    lesionados,
    lesionadosOrigen,
    conteoDiscrepante,
    franja: hourBand(s.hora),
    nocturno: isNight(s.hora),
    vulnerable,
    moto,
    pesado,
    tiposVehiculo: Array.from(new Set(vehTypes)),
    tiposUsuario: Array.from(new Set(userTypes)),
    zoneId: zone?.id ?? null,
    zoneCategory: zone?.category ?? null
  };
}

/** Construye la vista analítica de la región piloto sin multiplicar siniestros: personas y vehículos se anidan por código. */
export function buildViews(state: Pick<StoreState, 'siniestros' | 'personas' | 'vehiculos'>, analysis: AnalysisSnapshot | null): SiniestroView[] {
  const pBy = groupBy(state.personas, (p) => p.codigoSiniestro);
  const vBy = groupBy(state.vehiculos, (v) => v.codigoSiniestro);
  const zoneBy = new Map<string, {id: string;category: SiniestroView['zoneCategory'];}>();
  analysis?.zones.forEach((z) => z.memberCodes.forEach((c) => zoneBy.set(c, { id: z.id, category: z.category })));
  return state.siniestros.
  filter(inPilotRegion).
  map((s) => buildView(s, pBy.get(s.codigo) ?? [], vBy.get(s.codigo) ?? [], zoneBy.get(s.codigo) ?? null));
}

export interface Totals {
  siniestros: number;
  fallecidos: number | null;
  fallecidosSinDato: number;
  lesionados: number | null;
  lesionadosSinDato: number;
  coordValidas: number;
  coordShare: number | null;
  personas: number;
  vehiculos: number;
}

export function computeTotals(views: SiniestroView[]): Totals {
  const fKnown = views.filter((v) => v.fallecidos !== null);
  const lKnown = views.filter((v) => v.lesionados !== null);
  const coordValidas = views.filter((v) => v.coordStatus === 'valida').length;
  return {
    siniestros: views.length,
    fallecidos: fKnown.length ? fKnown.reduce((s, v) => s + (v.fallecidos ?? 0), 0) : null,
    fallecidosSinDato: views.length - fKnown.length,
    lesionados: lKnown.length ? lKnown.reduce((s, v) => s + (v.lesionados ?? 0), 0) : null,
    lesionadosSinDato: views.length - lKnown.length,
    coordValidas,
    coordShare: views.length ? coordValidas / views.length : null,
    personas: views.reduce((s, v) => s + v.personas.length, 0),
    vehiculos: views.reduce((s, v) => s + v.vehiculos.length, 0)
  };
}

export function countBy<T>(items: T[], key: (t: T) => string | null | string[]): {label: string;value: number;}[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    const keys = Array.isArray(k) ? k : [k];
    for (const kk of keys) {
      if (kk === null) continue;
      m.set(kk, (m.get(kk) ?? 0) + 1);
    }
  }
  return Array.from(m.entries()).
  map(([label, value]) => ({ label, value })).
  sort((a, b) => b.value - a.value);
}