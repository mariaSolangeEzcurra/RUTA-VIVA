/**
 * Mapas base que NO requieren API key.
 * (CARTO dejó de servir sus mosaicos raster sin clave en septiembre de 2026, por eso no se usa.)
 */
export interface Basemap {
  id: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

const esri = (service: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`;
const ESRI_ATTR = 'Mosaicos &copy; Esri &mdash; Esri, HERE, Garmin, &copy; colaboradores de OpenStreetMap';

export const BASEMAPS: Basemap[] = [
{ id: 'calles', label: 'Calles (OpenStreetMap)', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>', maxZoom: 19 },
{ id: 'esri-calles', label: 'Calles (Esri)', url: esri('World_Street_Map'), attribution: ESRI_ATTR, maxZoom: 19 },
{ id: 'gris', label: 'Gris claro', url: esri('Canvas/World_Light_Gray_Base'), attribution: ESRI_ATTR, maxZoom: 16 },
{ id: 'satelite', label: 'Satélite', url: esri('World_Imagery'), attribution: 'Imágenes &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19 },
{ id: 'relieve', label: 'Relieve', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', subdomains: 'abc', attribution: '&copy; OpenStreetMap, SRTM &mdash; estilo &copy; OpenTopoMap (CC-BY-SA)', maxZoom: 17 }];

export const DEFAULT_BASEMAP = 'calles';
/** Orden de respaldo si un proveedor no responde. */
export const FALLBACK_ORDER = ['calles', 'esri-calles', 'gris', 'satelite'];
