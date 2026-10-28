import type { SiniestroView } from '../types/data';

export interface QualityComponent {
  key: string;
  label: string;
  value: number | null;
  detail: string;
  inIndex: boolean;
}

export interface QualityReport {
  components: QualityComponent[];
  index: number | null;
  preliminarShare: number | null;
  n: number;
}

const ratio = (num: number, den: number) => den > 0 ? num / den : null;

/**
 * Índice de confianza del dato = promedio simple (pesos iguales) de los componentes con valor calculable
 * e incluidos en el índice. Es independiente del IPIV.
 */
export function qualityReport(views: SiniestroView[]): QualityReport {
  const n = views.length;
  const count = (fn: (v: SiniestroView) => boolean) => views.filter(fn).length;
  const keyFields: ((v: SiniestroView) => boolean)[] = [
  (v) => !!v.fecha, (v) => !!v.hora, (v) => !!v.provincia, (v) => !!v.distrito, (v) => !!v.clase,
  (v) => !!v.causa, (v) => v.coordStatus === 'valida', (v) => !!v.via];

  const completeness = n ? views.reduce((s, v) => s + keyFields.filter((f) => f(v)).length / keyFields.length, 0) / n : null;
  const components: QualityComponent[] = [
  { key: 'coord', label: 'Validez de coordenadas', value: ratio(count((v) => v.coordStatus === 'valida'), n), detail: 'Coordenadas numéricas dentro de la envolvente regional.', inIndex: true },
  { key: 'fecha', label: 'Integridad de fechas', value: ratio(count((v) => !!v.fecha), n), detail: 'Registros sin fecha válida se rechazan al importar (ver historial).', inIndex: true },
  { key: 'clase', label: 'Tipo de siniestro disponible', value: ratio(count((v) => !!v.clase), n), detail: 'Registros con clase de siniestro.', inIndex: true },
  { key: 'personas', label: 'Vinculación de personas', value: ratio(count((v) => v.personas.length > 0), n), detail: 'Siniestros con al menos una persona vinculada por código.', inIndex: true },
  { key: 'vehiculos', label: 'Vinculación de vehículos', value: ratio(count((v) => v.vehiculos.length > 0), n), detail: 'Siniestros con al menos un vehículo vinculado por código.', inIndex: true },
  { key: 'red', label: 'Coincidencia con red vial', value: null, detail: 'No calculable: no hay capa de red vial verificada cargada.', inIndex: false },
  { key: 'completitud', label: 'Completitud de variables', value: completeness, detail: 'Promedio de presencia de fecha, hora, provincia, distrito, clase, causa, coordenadas y vía.', inIndex: true },
  { key: 'traza', label: 'Trazabilidad de la fuente', value: ratio(count((v) => !!v.source?.importId), n), detail: 'Registros con archivo, hoja y fila de origen.', inIndex: true }];

  const usable = components.filter((c) => c.inIndex && c.value !== null);
  return {
    components,
    index: usable.length ? usable.reduce((s, c) => s + (c.value as number), 0) / usable.length : null,
    preliminarShare: ratio(count((v) => v.preliminar), n),
    n
  };
}