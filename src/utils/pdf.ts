import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnalysisSnapshot, Intervention, SiniestroView, Zone } from '../types/data';
import { categoryLabel, criteriaDefs } from '../data/ipivConfig';
import { RECOMMENDATION_DISCLAIMER, technicalReferences } from '../data/interventionCatalog';
import type { ZoneExplanation } from './explain';
import type { Recommendation } from './recommend';
import type { QualityReport } from './quality';
import type { EntityAssessment } from './entity';
import { stateLabel } from './interventions';

export interface ZonePdfInput {
  zone: Zone;
  snapshot: AnalysisSnapshot;
  members: SiniestroView[];
  explanation: ZoneExplanation;
  recommendations: Recommendation[];
  quality: QualityReport;
  entity: EntityAssessment;
  interventions: Intervention[];
  dataVersion: number;
}

type DocWithTable = jsPDF & {lastAutoTable?: {finalY: number;};};

const NAVY: [number, number, number] = [14, 35, 61];
const MUTED: [number, number, number] = [87, 99, 115];

export function buildZonePdf(input: ZonePdfInput): jsPDF {
  const { zone, snapshot, members, explanation, recommendations, quality, entity, interventions, dataVersion } = input;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as DocWithTable;
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  const header = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RUTA-VIVA PERÚ · Ficha técnica de zona prioritaria', 12, 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Prototipo de investigación — no es un documento oficial. Piloto: Región Arequipa.', 12, 16);
    doc.setTextColor(17, 24, 39);
  };
  const section = (title: string) => {
    if (y > 260) {doc.addPage();header();y = 30;}
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(title, 12, y);
    doc.setDrawColor(222, 227, 233);
    doc.line(12, y + 1.5, W - 12, y + 1.5);
    y += 6;
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  };
  const para = (text: string, color: [number, number, number] = [17, 24, 39]) => {
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - 24) as string[];
    if (y + lines.length * 4.2 > 285) {doc.addPage();header();y = 30;}
    doc.text(lines, 12, y);
    y += lines.length * 4.2 + 1.5;
    doc.setTextColor(17, 24, 39);
  };
  const table = (head: string[], body: (string | number)[][]) => {
    autoTable(doc, { startY: y, head: [head], body, margin: { left: 12, right: 12 }, styles: { fontSize: 8, cellPadding: 1.6 }, headStyles: { fillColor: NAVY }, didDrawPage: () => header() });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
  };

  header();
  y = 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`Zona ${zone.id}`, 12, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Puesto ${zone.rank} · IPIV ${zone.ipiv} · Prioridad ${categoryLabel[zone.category]} · ${snapshot.weightsVersion}`, 12, y);
  y += 8;

  section('1. Localización');
  table(['Campo', 'Valor'], [
  ['Provincia(s)', zone.provincias.join(', ') || 'Sin dato'],
  ['Distrito(s)', zone.distritos.join(', ') || 'Sin dato'],
  ['Centroide (WGS84)', `${zone.centroid[0].toFixed(5)}, ${zone.centroid[1].toFixed(5)}`],
  ['Radio de la concentración', `${Math.round(zone.radiusM)} m`],
  ['Carretera / ruta registrada', zone.vias.join(', ') || 'Pendiente de validación'],
  ['Tramo y progresiva', 'Pendiente de validación: no hay red vial verificada cargada']]
  );

  // Croquis esquemático (no cartográfico)
  section('2. Croquis esquemático de los siniestros (no cartográfico)');
  const pts = members.filter((m) => m.lat !== null && m.lon !== null);
  const boxX = 12,boxY = y,boxW = 80,boxH = 50;
  doc.setDrawColor(200, 205, 212);
  doc.rect(boxX, boxY, boxW, boxH);
  if (pts.length) {
    const lats = pts.map((p) => p.lat as number);
    const lons = pts.map((p) => p.lon as number);
    const [minLa, maxLa, minLo, maxLo] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
    const sx = (lo: number) => boxX + 5 + (lo - minLo) / Math.max(1e-9, maxLo - minLo) * (boxW - 10);
    const sy = (la: number) => boxY + boxH - 5 - (la - minLa) / Math.max(1e-9, maxLa - minLa) * (boxH - 10);
    doc.setFillColor(190, 18, 40);
    pts.forEach((p) => doc.circle(sx(p.lon as number), sy(p.lat as number), 1.1, 'F'));
  }
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize('Posición relativa de los siniestros de la zona. Para la ubicación precisa use las coordenadas y el visor del sistema.', W - boxW - 30) as string[], boxX + boxW + 6, boxY + 4);
  y = boxY + boxH + 8;
  doc.setTextColor(17, 24, 39);

  section('3. Evidencia histórica');
  table(['Indicador', 'Valor'], [
  ['Periodo analizado', explanation.period],
  ['Siniestros fatales', zone.siniestros],
  ['Años con siniestros', zone.years.join(', ')],
  ['Fallecidos', zone.fallecidos === null ? 'No disponible' : `${zone.fallecidos} (cobertura ${Math.round(zone.fallecidosCobertura * 100)} %)`],
  ['Lesionados', zone.lesionados === null ? 'No disponible' : `${zone.lesionados} (cobertura ${Math.round(zone.lesionadosCobertura * 100)} %)`]]
  );
  section('4. Patrón dominante');
  para(explanation.pattern);
  explanation.evidence.forEach((e) => para(`• ${e}`));

  section('5. Cálculo y explicación del IPIV');
  table(['Criterio', 'Valor bruto', 'Normalizado', 'Peso', 'Aporte'], criteriaDefs.map((c) => {
    const v = zone.criteria[c.key];
    return [c.label, v.raw === null ? 'Sin dato' : Number(v.raw.toFixed(3)), v.normalized === null ? '—' : v.normalized.toFixed(3), snapshot.weights[c.key].toFixed(3), v.contribution === null ? 'Excluido' : v.contribution.toFixed(1)];
  }));
  para(explanation.interpretation);
  para('IPIV = 100 x suma(w_i * x_i) / suma(w_i), sobre los criterios con dato; x_i normalizado min-max entre zonas. Pesos provisionales sujetos a validación técnica.', MUTED);

  section('6. Calidad y confianza del dato (independiente del IPIV)');
  table(['Componente', 'Valor'], quality.components.map((c) => [c.label, c.value === null ? 'No calculable' : `${Math.round(c.value * 100)} %`]));
  para(`Índice de confianza: ${quality.index === null ? 'No calculable' : `${Math.round(quality.index * 100)} %`} (promedio simple de componentes calculables).`);

  section('7. Intervenciones candidatas');
  recommendations.forEach((r) => {
    para(`${r.measure.pattern}: ${r.measure.measure}`);
    para(`Evidencia: ${r.evidence}`, MUTED);
    para(`Condiciones: ${r.measure.conditions} Limitaciones: ${r.measure.limitations}`, MUTED);
    para(`Levantamiento en campo: ${r.measure.fieldData.join('; ')}.`, MUTED);
    para(`Referencias: ${r.measure.references.map((id) => technicalReferences.find((t) => t.id === id)?.title).filter(Boolean).join('; ')}.`, MUTED);
  });
  para(RECOMMENDATION_DISCLAIMER, [190, 18, 40]);

  section('8. Entidad competente');
  para(entity.confirmed ? `Confirmada: ${entity.label}` : entity.label);
  para(entity.reason, MUTED);
  if (entity.candidate) para(`Candidata según clasificación registrada: ${entity.candidate.candidate} (${entity.candidate.legalBasis}). Requiere verificación.`, MUTED);

  section('9. Información faltante y siguiente paso');
  explanation.pending.forEach((p) => para(`• ${p}`));
  para(`Recomendación de inspección: ${explanation.nextStep}`);

  section('10. Indicadores para evaluar resultados');
  Array.from(new Set(recommendations.flatMap((r) => r.measure.outcomeIndicators))).forEach((i) => para(`• ${i}`));

  if (interventions.length) {
    section('11. Seguimiento registrado');
    table(['Medida', 'Estado', 'Entidad'], interventions.map((i) => [i.measureLabel, stateLabel[i.state], i.entity ?? 'Por verificar']));
  }

  section('Fuentes y versión');
  const sources = Array.from(new Set(members.map((m) => `${m.source.file} (hoja ${m.source.sheet})`)));
  para(`Fuentes: ${sources.join('; ') || 'Sin registro'}. Datos preliminares: ${members.some((m) => m.preliminar) ? 'sí' : 'no'}.`);
  para(`Versión de datos v${dataVersion} · Análisis de la versión v${snapshot.dataVersion} ejecutado el ${new Date(snapshot.ranAt).toLocaleString('es-PE')} · DBSCAN ε=${snapshot.params.epsMeters} m, minPts=${snapshot.params.minPts} · Generado el ${new Date().toLocaleString('es-PE')}.`, MUTED);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`RUTA-VIVA PERÚ · Zona ${zone.id} · Página ${i} de ${pages}`, 12, 292);
  }
  return doc;
}

export function downloadZonePdf(input: ZonePdfInput): void {
  buildZonePdf(input).save(`ficha_${input.zone.id}_v${input.dataVersion}.pdf`);
}