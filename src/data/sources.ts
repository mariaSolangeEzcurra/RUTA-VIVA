import type { DatasetKind } from '../types/data';

export interface OriginalSource {
  fileName: string;
  kind: DatasetKind;
  description: string;
  period: string;
  preliminar: boolean;
}

/** Las cuatro fuentes originales declaradas para el piloto. Su presencia se verifica contra el historial de importaciones. */
export const originalSources: OriginalSource[] = [
{ fileName: 'PERU. SINIESTROS DE TRANSITO POR AÑO_2008-2025_preliminar.xlsx', kind: 'historico', description: 'Estadística anual agregada de siniestros de tránsito en el Perú.', period: '2008–2025', preliminar: true },
{ fileName: 'BBDD ONSV - SINIESTROS FATALES 2021-2025 (preliminar).xlsx', kind: 'siniestros', description: 'Registro individual de siniestros fatales con ubicación.', period: '2021–2025', preliminar: true },
{ fileName: 'BBDD ONSV - PERSONAS 2021-2025 (preliminar).xlsx', kind: 'personas', description: 'Personas involucradas en siniestros fatales.', period: '2021–2025', preliminar: true },
{ fileName: 'BBDD ONSV - VEHICULOS 2021-2025 (preliminar).xlsx', kind: 'vehiculos', description: 'Vehículos involucrados en siniestros fatales.', period: '2021–2025', preliminar: true }];


export type ComplementaryStatus = 'disponible' | 'pendiente' | 'no_accesible';

export interface ComplementarySource {
  id: string;
  name: string;
  owner: string;
  use: string;
  status: ComplementaryStatus;
  note: string;
}

export const complementarySources: ComplementarySource[] = [
{ id: 'onsv-arequipa', name: 'Informe regional ONSV – Arequipa', owner: 'Observatorio Nacional de Seguridad Vial (MTC)', use: 'Contraste de puntos críticos oficiales en la validación.', status: 'pendiente', note: 'No se ha incorporado ningún archivo verificable.' },
{ id: 'sinac', name: 'Red vial (SINAC) – MTC / Provías', owner: 'Ministerio de Transportes y Comunicaciones', use: 'Asociación siniestro–tramo, progresivas y titularidad de la vía.', status: 'pendiente', note: 'Sin capa geoespacial cargada; las concentraciones no se presentan como tramos.' },
{ id: 'sutran', name: 'Datos de fiscalización SUTRAN', owner: 'SUTRAN', use: 'Contexto de fiscalización en la red vial nacional.', status: 'pendiente', note: 'No incorporado.' },
{ id: 'ositran', name: 'Infraestructura concesionada', owner: 'OSITRAN', use: 'Identificar tramos concesionados y su responsable.', status: 'pendiente', note: 'No incorporado.' },
{ id: 'intervenciones', name: 'Registro de intervenciones viales', owner: 'Entidades viales', use: 'Evaluación antes/después.', status: 'pendiente', note: 'Se registran manualmente en Seguimiento.' },
{ id: 'inei', name: 'Límites territoriales', owner: 'INEI', use: 'Agregación por provincia y distrito.', status: 'pendiente', note: 'Se usan los nombres registrados en la fuente.' },
{ id: 'salud-educacion', name: 'Establecimientos de salud y centros educativos', owner: 'MINSA / MINEDU (ESCALE)', use: 'Criterio de entorno sensible del IPIV.', status: 'pendiente', note: 'Criterio excluido del cálculo hasta disponer de la capa.' },
{ id: 'peajes', name: 'Flujo vehicular en peajes', owner: 'MTC / Provías', use: 'Ranking de riesgo relativo por exposición.', status: 'pendiente', note: 'Sin exposición válida no se calcula el ranking de riesgo relativo.' },
{ id: 'osm', name: 'OpenStreetMap', owner: 'Colaboradores de OpenStreetMap', use: 'Cartografía base del visor.', status: 'disponible', note: 'Usado solo como mapa base de referencia, con atribución visible.' },
{ id: 'senamhi', name: 'Información meteorológica', owner: 'SENAMHI', use: 'Contexto de condiciones climáticas.', status: 'pendiente', note: 'No incorporado.' }];