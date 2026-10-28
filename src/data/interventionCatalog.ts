export interface TechnicalReference {
  id: string;
  title: string;
  publisher: string;
  year: string;
  url: string;
}

export const technicalReferences: TechnicalReference[] = [
{ id: 'who-savelives', title: 'Save LIVES: A road safety technical package', publisher: 'Organización Mundial de la Salud', year: '2017', url: 'https://www.who.int/publications/i/item/save-lives-a-road-safety-technical-package' },
{ id: 'who-pedestrian', title: 'Pedestrian safety: a road safety manual for decision-makers and practitioners', publisher: 'Organización Mundial de la Salud', year: '2013', url: 'https://www.who.int/publications/i/item/pedestrian-safety-a-road-safety-manual-for-decision-makers-and-practitioners' },
{ id: 'who-speed', title: 'Speed management: a road safety manual for decision-makers and practitioners (2.ª ed.)', publisher: 'OMS / Global Road Safety Partnership', year: '2023', url: 'https://www.grsproadsafety.org/resources/speed-management-manual/' },
{ id: 'who-motorcycle', title: 'Powered two- and three-wheeler safety: a road safety manual', publisher: 'Organización Mundial de la Salud', year: '2017', url: 'https://www.who.int/publications/i/item/powered-two-and-three-wheeler-safety-a-road-safety-manual-for-decision-makers-and-practitioners' },
{ id: 'fhwa-psc', title: 'Proven Safety Countermeasures', publisher: 'Federal Highway Administration (EE. UU.)', year: 'Programa vigente', url: 'https://highways.dot.gov/safety/proven-safety-countermeasures' },
{ id: 'piarc-rsm', title: 'Road Safety Manual', publisher: 'PIARC – Asociación Mundial de la Carretera', year: 'Edición en línea', url: 'https://roadsafety.piarc.org' },
{ id: 'irap-toolkit', title: 'Road Safety Toolkit', publisher: 'iRAP', year: 'Edición en línea', url: 'https://toolkit.irap.org' },
{ id: 'mtc-dispositivos', title: 'Manual de Dispositivos de Control del Tránsito Automotor para Calles y Carreteras', publisher: 'Ministerio de Transportes y Comunicaciones (Perú)', year: '2016', url: 'https://portal.mtc.gob.pe/transportes/caminos/normas_carreteras/manuales.html' },
{ id: 'mtc-dg2018', title: 'Manual de Carreteras: Diseño Geométrico DG-2018', publisher: 'Ministerio de Transportes y Comunicaciones (Perú)', year: '2018', url: 'https://portal.mtc.gob.pe/transportes/caminos/normas_carreteras/manuales.html' }];


export type PatternTrigger =
'atropello_nocturno' |
'atropello' |
'choque' |
'choque_frontal' |
'despiste' |
'volcadura_pesados' |
'motociclistas' |
'entorno_escolar' |
'sin_patron';

export interface InterventionMeasure {
  id: string;
  trigger: PatternTrigger;
  pattern: string;
  measure: string;
  conditions: string;
  limitations: string;
  fieldData: string[];
  references: string[];
  outcomeIndicators: string[];
}

export const interventionCatalog: InterventionMeasure[] = [
{
  id: 'M-ATN', trigger: 'atropello_nocturno', pattern: 'Atropellos con predominio nocturno',
  measure: 'Evaluar iluminación peatonal, visibilidad de cruces, refugios peatonales y gestión de velocidad.',
  conditions: 'Presencia de demanda peatonal y cruces informales verificados en campo; condiciones de iluminación deficientes comprobadas por medición.',
  limitations: 'El registro no identifica la ubicación exacta del cruce ni el nivel de iluminación existente.',
  fieldData: ['Medición de niveles de iluminación', 'Conteo peatonal por franja', 'Ubicación de cruces formales e informales', 'Velocidades de operación'],
  references: ['who-pedestrian', 'fhwa-psc', 'mtc-dispositivos'],
  outcomeIndicators: ['Atropellos nocturnos registrados por año', 'Velocidad percentil 85 en el punto']
},
{
  id: 'M-ATR', trigger: 'atropello', pattern: 'Atropellos recurrentes',
  measure: 'Evaluar cruces peatonales señalizados, veredas continuas, reducción de ancho de cruce y control de velocidad.',
  conditions: 'Flujos peatonales y generadores de viaje identificados en campo.',
  limitations: 'Sin capa de infraestructura peatonal no se puede confirmar la ausencia de veredas o cruces.',
  fieldData: ['Inventario de veredas y cruces', 'Generadores de viaje (mercados, paraderos)', 'Velocidades de operación'],
  references: ['who-pedestrian', 'irap-toolkit', 'mtc-dispositivos'],
  outcomeIndicators: ['Atropellos registrados por año', 'Porcentaje de cruces señalizados']
},
{
  id: 'M-CHO', trigger: 'choque', pattern: 'Choques recurrentes (posible intersección)',
  measure: 'Evaluar visibilidad, señalización de prioridad, semaforización o rediseño de la intersección.',
  conditions: 'Solo aplica si la inspección confirma que los choques ocurren en una intersección.',
  limitations: 'La fuente no indica de forma fiable si el siniestro ocurrió en intersección.',
  fieldData: ['Confirmación de intersección', 'Triángulos de visibilidad', 'Señalización existente', 'Volúmenes por acceso'],
  references: ['fhwa-psc', 'piarc-rsm', 'mtc-dispositivos'],
  outcomeIndicators: ['Choques registrados por año en la zona']
},
{
  id: 'M-FRO', trigger: 'choque_frontal', pattern: 'Colisiones frontales',
  measure: 'Evaluar separación central, barreras, demarcación de prohibición de adelantar y control de adelantamientos.',
  conditions: 'Vía de calzada única con evidencia de maniobras de adelantamiento; ancho disponible verificado.',
  limitations: 'Sin geometría verificada no puede determinarse la viabilidad de separación física.',
  fieldData: ['Sección transversal', 'Distancia de visibilidad de adelantamiento', 'Demarcación existente'],
  references: ['piarc-rsm', 'irap-toolkit', 'mtc-dg2018'],
  outcomeIndicators: ['Colisiones frontales registradas por año']
},
{
  id: 'M-DES', trigger: 'despiste', pattern: 'Despistes recurrentes (posible curva)',
  measure: 'Evaluar delineadores, señalización de curva, bandas alertadoras, barreras de contención y geometría.',
  conditions: 'Presencia de curva o pendiente verificada; zona lateral peligrosa comprobada.',
  limitations: 'La fuente no registra la geometría de la vía; la curva debe confirmarse en campo.',
  fieldData: ['Radio de curva y peralte', 'Estado de bermas y zona lateral', 'Señalización y delineación existentes', 'Velocidades de operación'],
  references: ['fhwa-psc', 'mtc-dispositivos', 'mtc-dg2018'],
  outcomeIndicators: ['Despistes registrados por año', 'Velocidad de operación en la curva']
},
{
  id: 'M-VOL', trigger: 'volcadura_pesados', pattern: 'Volcaduras con participación de vehículos pesados',
  measure: 'Evaluar gestión de velocidad, advertencia anticipada de curvas y pendientes, y características de la vía.',
  conditions: 'Participación de vehículos pesados confirmada en el registro vinculado; pendiente o curva verificada.',
  limitations: 'Sin datos de exposición de vehículos pesados no puede estimarse el riesgo relativo.',
  fieldData: ['Pendiente longitudinal', 'Rampas de emergencia existentes', 'Señalización preventiva', 'Composición vehicular'],
  references: ['who-speed', 'piarc-rsm', 'mtc-dispositivos'],
  outcomeIndicators: ['Volcaduras de vehículos pesados por año']
},
{
  id: 'M-MOT', trigger: 'motociclistas', pattern: 'Alta participación de motocicletas o trimotos',
  measure: 'Evaluar gestión de velocidad, señalización y fiscalización focalizada (casco, velocidad).',
  conditions: 'Participación de motocicletas confirmada en vehículos o personas vinculadas.',
  limitations: 'La participación no implica responsabilidad del motociclista.',
  fieldData: ['Composición vehicular', 'Uso de casco observado', 'Velocidades de operación'],
  references: ['who-motorcycle', 'who-speed', 'who-savelives'],
  outcomeIndicators: ['Siniestros con motocicletas por año']
},
{
  id: 'M-ESC', trigger: 'entorno_escolar', pattern: 'Siniestros cerca de centros educativos',
  measure: 'Evaluar zona escolar, cruces seguros, veredas y control de velocidad.',
  conditions: 'Requiere capa verificada de centros educativos (no disponible actualmente).',
  limitations: 'No evaluable: no se dispone de capa geográfica de centros educativos.',
  fieldData: ['Ubicación de centros educativos', 'Horarios de entrada y salida'],
  references: ['who-pedestrian', 'mtc-dispositivos'],
  outcomeIndicators: ['Siniestros con menores de edad por año']
},
{
  id: 'M-ISV', trigger: 'sin_patron', pattern: 'Concentración sin patrón dominante fiable',
  measure: 'Realizar una inspección de seguridad vial general antes de proponer medidas específicas.',
  conditions: 'Aplica cuando la evidencia no permite identificar un mecanismo dominante.',
  limitations: 'No se propone una medida específica por falta de evidencia.',
  fieldData: ['Inventario vial completo', 'Revisión de expedientes policiales', 'Velocidades de operación'],
  references: ['piarc-rsm', 'irap-toolkit'],
  outcomeIndicators: ['Siniestros fatales registrados por año en la zona']
}];


export const RECOMMENDATION_DISCLAIMER = 'Intervención candidata sujeta a evaluación e inspección técnica. No constituye una orden automática de ejecución.';