import type { DatasetKind } from '../types/data';

export type FieldType = 'text' | 'int' | 'number' | 'date' | 'time' | 'lat' | 'lon';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  synonyms: string[];
}

export const datasetLabels: Record<DatasetKind, string> = {
  siniestros: 'Siniestros (registro individual)',
  personas: 'Personas involucradas',
  vehiculos: 'Vehículos involucrados',
  historico: 'Estadística histórica agregada'
};

export const fieldSchemas: Record<DatasetKind, FieldDef[]> = {
  siniestros: [
  { key: 'codigo', label: 'Código del siniestro', type: 'text', required: true, synonyms: ['CODIGO SINIESTRO', 'COD SINIESTRO', 'ID SINIESTRO', 'CODIGO DE SINIESTRO', 'NRO SINIESTRO', 'CODIGO', 'ID'] },
  { key: 'fecha', label: 'Fecha', type: 'date', required: true, synonyms: ['FECHA SINIESTRO', 'FECHA DEL SINIESTRO', 'FECHA OCURRENCIA', 'FECHA'] },
  { key: 'hora', label: 'Hora', type: 'time', required: false, synonyms: ['HORA SINIESTRO', 'HORA DEL SINIESTRO', 'HORA OCURRENCIA', 'HORA'] },
  { key: 'anio', label: 'Año', type: 'int', required: false, synonyms: ['ANO', 'ANIO', 'ANO SINIESTRO'] },
  { key: 'departamento', label: 'Departamento', type: 'text', required: false, synonyms: ['DEPARTAMENTO', 'REGION', 'DPTO'] },
  { key: 'provincia', label: 'Provincia', type: 'text', required: false, synonyms: ['PROVINCIA', 'PROV'] },
  { key: 'distrito', label: 'Distrito', type: 'text', required: false, synonyms: ['DISTRITO', 'DIST'] },
  { key: 'direccion', label: 'Dirección o referencia', type: 'text', required: false, synonyms: ['DIRECCION', 'REFERENCIA', 'UBICACION', 'LUGAR', 'DIRECCION REFERENCIA'] },
  { key: 'via', label: 'Carretera / código de ruta', type: 'text', required: false, synonyms: ['CODIGO DE VIA', 'CODIGO VIA', 'CODIGO RUTA', 'RUTA', 'CARRETERA', 'NOMBRE VIA', 'VIA'] },
  { key: 'redVial', label: 'Red vial / clasificación', type: 'text', required: false, synonyms: ['RED VIAL', 'TIPO RED VIAL', 'TIPO DE RED', 'CLASIFICACION VIA', 'JURISDICCION', 'TIPO DE VIA', 'TIPO VIA'] },
  { key: 'kilometro', label: 'Kilómetro / progresiva', type: 'text', required: false, synonyms: ['KILOMETRO', 'KM', 'PROGRESIVA'] },
  { key: 'lat', label: 'Latitud', type: 'lat', required: false, synonyms: ['COORDENADAS LATITUD', 'LATITUD', 'LAT', 'COORDENADA Y', 'Y'] },
  { key: 'lon', label: 'Longitud', type: 'lon', required: false, synonyms: ['COORDENADAS LONGITUD', 'LONGITUD', 'LON', 'LONG', 'COORDENADA X', 'X'] },
  { key: 'clase', label: 'Clase / tipo de siniestro', type: 'text', required: false, synonyms: ['CLASE SINIESTRO', 'CLASE DE SINIESTRO', 'TIPO SINIESTRO', 'TIPO DE SINIESTRO', 'MODALIDAD', 'CLASE'] },
  { key: 'causa', label: 'Causa registrada', type: 'text', required: false, synonyms: ['CAUSA FACTOR PRINCIPAL', 'CAUSA PRINCIPAL', 'CAUSA ESPECIFICA', 'FACTOR PRINCIPAL', 'CAUSA'] },
  { key: 'fallecidosFuente', label: 'Fallecidos (según registro)', type: 'int', required: false, synonyms: ['CANTIDAD FALLECIDOS', 'CANTIDAD DE FALLECIDOS', 'NRO FALLECIDOS', 'FALLECIDOS'] },
  { key: 'lesionadosFuente', label: 'Lesionados (según registro)', type: 'int', required: false, synonyms: ['CANTIDAD LESIONADOS', 'CANTIDAD DE LESIONADOS', 'NRO LESIONADOS', 'LESIONADOS', 'HERIDOS'] },
  { key: 'vehiculosFuente', label: 'Vehículos (según registro)', type: 'int', required: false, synonyms: ['CANTIDAD VEHICULOS', 'CANTIDAD DE VEHICULOS', 'NRO VEHICULOS', 'VEHICULOS'] }],

  personas: [
  { key: 'codigoSiniestro', label: 'Código del siniestro', type: 'text', required: true, synonyms: ['CODIGO SINIESTRO', 'COD SINIESTRO', 'ID SINIESTRO', 'CODIGO DE SINIESTRO', 'CODIGO'] },
  { key: 'idPersona', label: 'Identificador interno de persona (no se publica)', type: 'text', required: false, synonyms: ['ID PERSONA', 'CODIGO PERSONA', 'NRO PERSONA', 'ITEM PERSONA', 'ITEM'] },
  { key: 'condicion', label: 'Condición / consecuencia', type: 'text', required: false, synonyms: ['CONDICION PERSONA', 'ESTADO PERSONA', 'CONSECUENCIA', 'CONDICION', 'ESTADO', 'GRAVEDAD'] },
  { key: 'tipoUsuario', label: 'Tipo de usuario vial', type: 'text', required: false, synonyms: ['TIPO USUARIO', 'TIPO DE USUARIO', 'USUARIO VIAL', 'TIPO PERSONA', 'ROL', 'CALIDAD'] },
  { key: 'edad', label: 'Edad', type: 'int', required: false, synonyms: ['EDAD'] },
  { key: 'sexo', label: 'Sexo', type: 'text', required: false, synonyms: ['SEXO', 'GENERO'] }],

  vehiculos: [
  { key: 'codigoSiniestro', label: 'Código del siniestro', type: 'text', required: true, synonyms: ['CODIGO SINIESTRO', 'COD SINIESTRO', 'ID SINIESTRO', 'CODIGO DE SINIESTRO', 'CODIGO'] },
  { key: 'idVehiculo', label: 'Identificador interno de vehículo', type: 'text', required: false, synonyms: ['ID VEHICULO', 'CODIGO VEHICULO', 'NRO VEHICULO', 'ITEM VEHICULO', 'ITEM'] },
  { key: 'tipo', label: 'Tipo / clase de vehículo', type: 'text', required: false, synonyms: ['TIPO VEHICULO', 'TIPO DE VEHICULO', 'CLASE VEHICULO', 'CLASE DE VEHICULO', 'VEHICULO', 'CATEGORIA'] },
  { key: 'servicio', label: 'Servicio / uso', type: 'text', required: false, synonyms: ['TIPO SERVICIO', 'TIPO DE SERVICIO', 'SERVICIO', 'USO'] }],

  historico: [
  { key: 'anio', label: 'Año', type: 'int', required: true, synonyms: ['ANO', 'ANIO', 'PERIODO'] },
  { key: 'ambito', label: 'Ámbito (departamento / país)', type: 'text', required: false, synonyms: ['DEPARTAMENTO', 'REGION', 'AMBITO'] },
  { key: 'siniestros', label: 'Siniestros', type: 'int', required: false, synonyms: ['TOTAL SINIESTROS', 'SINIESTROS', 'ACCIDENTES'] },
  { key: 'fallecidos', label: 'Fallecidos', type: 'int', required: false, synonyms: ['FALLECIDOS', 'MUERTOS'] },
  { key: 'lesionados', label: 'Lesionados', type: 'int', required: false, synonyms: ['LESIONADOS', 'HERIDOS'] }]

};

/** Encabezados que nunca se importan por contener datos personales identificables. */
export const sensitiveHeaderTokens = ['DNI', 'NOMBRE', 'NOMBRES', 'APELLIDO', 'APELLIDOS', 'PLACA', 'LICENCIA', 'DOCUMENTO', 'TELEFONO', 'CELULAR'];

export const PILOT_REGION = 'AREQUIPA';
export const MAX_FILE_BYTES = 30 * 1024 * 1024;