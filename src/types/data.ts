export type DatasetKind = 'siniestros' | 'personas' | 'vehiculos' | 'historico';

export type CoordStatus =
'valida' |
'faltante' |
'no_numerica' |
'cero' |
'fuera_peru' |
'fuera_region' |
'invertida';

export interface SourceRef {
  importId: string;
  file: string;
  sheet: string;
  row: number;
  declaredSource: string;
}

export interface Siniestro {
  codigo: string;
  fecha: string | null;
  anio: number | null;
  hora: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  direccion: string | null;
  via: string | null;
  redVial: string | null;
  kilometro: string | null;
  lat: number | null;
  lon: number | null;
  coordStatus: CoordStatus;
  clase: string | null;
  causa: string | null;
  fallecidosFuente: number | null;
  lesionadosFuente: number | null;
  vehiculosFuente: number | null;
  preliminar: boolean;
  source: SourceRef;
}

export interface Persona {
  key: string;
  codigoSiniestro: string;
  condicion: string | null;
  tipoUsuario: string | null;
  edad: number | null;
  sexo: string | null;
  preliminar: boolean;
  source: SourceRef;
}

export interface Vehiculo {
  key: string;
  codigoSiniestro: string;
  tipo: string | null;
  servicio: string | null;
  preliminar: boolean;
  source: SourceRef;
}

export interface HistoricoRow {
  key: string;
  anio: number;
  ambito: string;
  siniestros: number | null;
  fallecidos: number | null;
  lesionados: number | null;
  preliminar: boolean;
  source: SourceRef;
}

export type AnyRecord = Siniestro | Persona | Vehiculo | HistoricoRow;

export type ImportStatus = 'completada' | 'completada_con_observaciones' | 'fallida' | 'cancelada';

export interface ImportIssue {
  row: number;
  field?: string;
  severity: 'error' | 'advertencia';
  message: string;
}

export interface ImportLog {
  id: string;
  fileName: string;
  fileSize: number;
  sheet: string;
  kind: DatasetKind;
  declaredSource: string;
  period: string | null;
  preliminar: boolean;
  startedAt: string;
  finishedAt: string;
  read: number;
  nuevos: number;
  actualizados: number;
  duplicados: number;
  rechazados: number;
  pendientes: number;
  fueraAmbito: number;
  conflictos: number;
  warnings: string[];
  errors: string[];
  status: ImportStatus;
  dataVersion: number | null;
  issuesSample: ImportIssue[];
  mapping: Record<string, string | null>;
}

export type ConflictPolicy = 'conservar' | 'completar' | 'sobrescribir';

export interface Conflict {
  id: string;
  importId: string;
  kind: DatasetKind;
  key: string;
  field: string;
  existing: string;
  incoming: string;
  incomingValue: string | number | boolean | null;
  resolution: 'pendiente' | 'conservado' | 'actualizado';
}

export interface ClusterParams {
  epsMeters: number;
  minPts: number;
}

export type CriterionKey =
'consecuencias' |
'recurrencia' |
'concentracion' |
'vulnerables' |
'temporal' |
'patronVial' |
'entorno' |
'exposicion';

export type IpivWeights = Record<CriterionKey, number>;

export type PriorityCategory = 'muy_alta' | 'alta' | 'media' | 'baja';

export interface ZoneCriterionValue {
  raw: number | null;
  normalized: number | null;
  contribution: number | null;
  detail: string;
}

export interface ClassShare {
  label: string;
  count: number;
  share: number;
}

export interface Zone {
  id: string;
  rank: number;
  memberCodes: string[];
  centroid: [number, number];
  radiusM: number;
  years: number[];
  provincias: string[];
  distritos: string[];
  vias: string[];
  redesViales: string[];
  siniestros: number;
  fallecidos: number | null;
  fallecidosCobertura: number;
  lesionados: number | null;
  lesionadosCobertura: number;
  dominantClass: ClassShare | null;
  classShares: ClassShare[];
  nightShare: number | null;
  hoursKnown: number;
  vulnerableShare: number | null;
  vulnerableKnown: number;
  motoShare: number | null;
  heavyShare: number | null;
  criteria: Record<CriterionKey, ZoneCriterionValue>;
  ipiv: number;
  category: PriorityCategory;
}

export interface AnalysisSnapshot {
  dataVersion: number;
  ranAt: string;
  params: ClusterParams;
  weights: IpivWeights;
  weightsVersion: string;
  analyzedCount: number;
  validCoordCount: number;
  noiseCount: number;
  yearsAnalyzed: number[];
  zones: Zone[];
}

export type InterventionState =
'identificada' |
'pendiente_inspeccion' |
'evaluada' |
'aprobada' |
'en_ejecucion' |
'ejecutada' |
'descartada';

export interface InterventionEvent {
  at: string;
  effectiveDate: string;
  from: InterventionState | null;
  to: InterventionState;
  note: string;
}

export interface Intervention {
  id: string;
  zoneId: string;
  zoneLabel: string;
  zoneCentroid: [number, number];
  zoneRadiusM: number;
  zoneMemberCodes: string[];
  measureId: string;
  measureLabel: string;
  entity: string | null;
  responsable: string | null;
  state: InterventionState;
  observations: string;
  documents: string[];
  history: InterventionEvent[];
  createdAt: string;
  executedOn: string | null;
}

export type EntityStatus = 'por_verificar' | 'en_evaluacion' | 'confirmada';

export interface EntityRecord {
  zoneId: string;
  entidad: string;
  responsable: string;
  estado: EntityStatus;
  nota: string;
  updatedAt: string;
}

export interface StoreState {
  siniestros: Siniestro[];
  personas: Persona[];
  vehiculos: Vehiculo[];
  historico: HistoricoRow[];
  imports: ImportLog[];
  conflicts: Conflict[];
  dataVersion: number;
  lastProcessedAt: string | null;
  analysis: AnalysisSnapshot | null;
  weights: IpivWeights;
  weightsVersion: string;
  clusterParams: ClusterParams;
  interventions: Intervention[];
  entities: Record<string, EntityRecord>;
}

export interface Filters {
  yearFrom: number | null;
  yearTo: number | null;
  provincia: string | null;
  distrito: string | null;
  via: string | null;
  clase: string | null;
  causa: string | null;
  tipoVehiculo: string | null;
  tipoUsuario: string | null;
  franja: string | null;
  gravedad: 'uno' | 'multiple' | 'con_lesionados' | null;
  prioridad: PriorityCategory | null;
  tipoZona: 'concentracion' | 'aislado' | null;
}

export interface SiniestroView extends Siniestro {
  personas: Persona[];
  vehiculos: Vehiculo[];
  fallecidos: number | null;
  fallecidosOrigen: 'personas' | 'fuente' | null;
  lesionados: number | null;
  lesionadosOrigen: 'personas' | 'fuente' | null;
  conteoDiscrepante: boolean;
  franja: string | null;
  nocturno: boolean | null;
  vulnerable: boolean | null;
  moto: boolean | null;
  pesado: boolean | null;
  tiposVehiculo: string[];
  tiposUsuario: string[];
  zoneId: string | null;
  zoneCategory: PriorityCategory | null;
}