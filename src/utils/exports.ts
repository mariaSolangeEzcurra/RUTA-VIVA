import type { SiniestroView, StoreState } from '../types/data';
import { originalSources } from '../data/sources';
import { computeTotals, countBy } from './metrics';
import { weekdayOf, weekdays } from './parsing';
import { qualityReport } from './quality';
import { normalizeText } from './text';

export interface DerivedFile {
  name: string;
  description: string;
  available: boolean;
  build: () => unknown;
}

/** Archivos derivados equivalentes a los definidos para el pipeline. Se generan en JSON (Parquet no disponible en el navegador). */
export function derivedFiles(state: StoreState, views: SiniestroView[]): DerivedFile[] {
  const snap = state.analysis;
  const meta = { dataVersion: state.dataVersion, generatedAt: new Date().toISOString(), region: 'AREQUIPA', preliminar: views.some((v) => v.preliminar) };
  return [
  { name: 'historico_regional.json', description: 'Estadística histórica agregada importada.', available: state.historico.length > 0, build: () => ({ ...meta, rows: [...state.historico].sort((a, b) => a.anio - b.anio).map(({ source, ...r }) => ({ ...r, fuente: source.file })) }) },
  { name: 'kpis_arequipa.json', description: 'Indicadores de la región piloto por año.', available: views.length > 0, build: () => ({
      ...meta, total: computeTotals(views),
      porAnio: Array.from(new Set(views.map((v) => v.anio))).sort().map((y) => ({ anio: y, ...computeTotals(views.filter((v) => v.anio === y)) })),
      calidad: qualityReport(views)
    }) },
  { name: 'siniestros_georreferenciados.json', description: 'Siniestros con coordenadas válidas (sin datos personales).', available: views.some((v) => v.coordStatus === 'valida'), build: () => ({
      ...meta, crs: 'EPSG:4326',
      registros: views.filter((v) => v.coordStatus === 'valida').map((v) => ({ codigo: v.codigo, fecha: v.fecha, hora: v.hora, provincia: v.provincia, distrito: v.distrito, via: v.via, clase: v.clase, causa: v.causa, lat: v.lat, lon: v.lon, fallecidos: v.fallecidos, lesionados: v.lesionados, zona: v.zoneId, fuente: `${v.source.file}#${v.source.sheet}:${v.source.row}` }))
    }) },
  { name: 'personas_por_siniestro.json', description: 'Conteos agregados de personas por siniestro (sin identificadores).', available: state.personas.length > 0, build: () => ({
      ...meta, registros: views.filter((v) => v.personas.length).map((v) => ({ codigo: v.codigo, personas: v.personas.length, fallecidos: v.fallecidos, lesionados: v.lesionados, tiposUsuario: v.tiposUsuario }))
    }) },
  { name: 'vehiculos_por_siniestro.json', description: 'Conteos agregados de vehículos por siniestro.', available: state.vehiculos.length > 0, build: () => ({
      ...meta, registros: views.filter((v) => v.vehiculos.length).map((v) => ({ codigo: v.codigo, vehiculos: v.vehiculos.length, tipos: v.tiposVehiculo }))
    }) },
  { name: 'patrones_siniestros.json', description: 'Distribuciones por clase, causa, franja, día y provincia.', available: views.length > 0, build: () => ({
      ...meta,
      clase: countBy(views, (v) => v.clase), causa: countBy(views, (v) => v.causa), franja: countBy(views, (v) => v.franja),
      dia: countBy(views, (v) => {const d = weekdayOf(v.fecha);return d === null ? null : weekdays[d];}),
      provincia: countBy(views, (v) => v.provincia)
    }) },
  { name: 'zonas_analizadas.json', description: 'Concentraciones DBSCAN del último análisis.', available: !!snap, build: () => ({ ...meta, analisis: snap ? { dataVersion: snap.dataVersion, ranAt: snap.ranAt, params: snap.params } : null, zonas: snap?.zones ?? [] }) },
  { name: 'ranking_ipiv.json', description: 'Ranking IPIV con contribuciones por criterio.', available: !!snap, build: () => ({
      ...meta, version: snap?.weightsVersion, pesos: snap?.weights,
      ranking: snap?.zones.map((z) => ({ puesto: z.rank, zona: z.id, ipiv: z.ipiv, categoria: z.category, siniestros: z.siniestros, fallecidos: z.fallecidos, criterios: z.criteria })) ?? []
    }) },
  { name: 'metadata_fuentes.json', description: 'Fuentes, importaciones y versiones.', available: true, build: () => ({
      ...meta,
      fuentesOriginales: originalSources.map((s) => ({ ...s, estado: state.imports.some((i) => i.status !== 'fallida' && normalizeText(i.fileName) === normalizeText(s.fileName)) ? 'importada' : 'no accesible en este entorno' })),
      importaciones: state.imports.map(({ issuesSample, ...i }) => ({ ...i, incidenciasRegistradas: issuesSample.length })),
      analisis: snap ? { dataVersion: snap.dataVersion, ranAt: snap.ranAt } : null
    }) }];

}