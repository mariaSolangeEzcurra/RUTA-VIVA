import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, FileDownIcon, MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Intervention } from '../types/data';
import { useData } from '../contexts/DataContext';
import { useZoneTools } from '../hooks/useZoneTools';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { QualitySummary } from '../components/QualitySummary';
import { ZoneExplanationPanel } from '../components/zone/ZoneExplanationPanel';
import { RecommendationList } from '../components/zone/RecommendationList';
import { EntityPanel } from '../components/zone/EntityPanel';
import { explainZone } from '../utils/explain';
import { recommendForZone } from '../utils/recommend';
import type { Recommendation } from '../utils/recommend';
import { qualityReport } from '../utils/quality';
import { assessEntity } from '../utils/entity';
import { stateLabel } from '../utils/interventions';
import { titleCase, uid } from '../utils/text';

export function ZoneDetail() {
  const { id } = useParams();
  const { state, saveIntervention } = useData();
  const { getZone, membersOf, downloadFicha } = useZoneTools();
  const zone = getZone(id ? decodeURIComponent(id) : null);
  const snap = state.analysis;

  const data = useMemo(() => {
    if (!zone || !snap) return null;
    const members = membersOf(zone).sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
    return { members, explanation: explainZone(zone, snap), recs: recommendForZone(zone), quality: qualityReport(members) };
  }, [zone, snap, membersOf]);

  if (!zone || !snap || !data) {
    return <main className="mx-auto w-full max-w-3xl px-4 py-12"><EmptyState title="Zona no encontrada" description="La zona no existe en el último análisis. Puede haber cambiado tras un reprocesamiento con nuevos datos o parámetros." actionLabel="Ver ranking IPIV" actionTo="/ranking" /></main>;
  }

  const zoneInterventions = state.interventions.filter((i) => i.zoneId === zone.id);
  const label = zone.distritos.map(titleCase).join(', ') || 'Distrito sin dato';

  const register = async (r: Recommendation) => {
    const entity = assessEntity(zone, state.entities[zone.id]);
    const now = new Date().toISOString();
    const iv: Intervention = {
      id: uid('INT'), zoneId: zone.id, zoneLabel: `${label} · ${zone.id}`, zoneCentroid: zone.centroid, zoneRadiusM: zone.radiusM, zoneMemberCodes: zone.memberCodes,
      measureId: r.measure.id, measureLabel: r.measure.measure, entity: entity.confirmed ? entity.label : null, responsable: state.entities[zone.id]?.responsable || null,
      state: 'identificada', observations: `Evidencia al registrar: ${r.evidence}`, documents: [],
      history: [{ at: now, effectiveDate: now.slice(0, 10), from: null, to: 'identificada', note: 'Registrada como candidata desde el detalle de zona.' }],
      createdAt: now, executedOn: null
    };
    await saveIntervention(iv);
    toast.success('Intervención candidata registrada en Seguimiento (estado: Identificada).');
  };

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <Link to="/ranking" className="inline-flex items-center gap-1 text-xs font-medium text-primary"><ArrowLeftIcon className="h-3 w-3" />Ranking IPIV</Link>
      <div className="mt-3 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs text-muted">{zone.id}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="mt-1 text-sm text-muted">{zone.provincias.map(titleCase).join(', ') || 'Provincia sin dato'} · centroide {zone.centroid[0].toFixed(5)}, {zone.centroid[1].toFixed(5)} · radio {Math.round(zone.radiusM)} m</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted">Puesto {zone.rank} de {snap.zones.length}</p>
            <p className="text-3xl font-semibold tabular-nums leading-none">{zone.ipiv}</p>
          </div>
          <PriorityBadge category={zone.category} />
          <Link to={`/mapa?zona=${encodeURIComponent(zone.id)}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium hover:bg-canvas"><MapIcon className="h-4 w-4" />Ver en mapa</Link>
          <Button onClick={() => downloadFicha(zone)}><FileDownIcon className="h-4 w-4" />Ficha técnica PDF</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <ZoneExplanationPanel zone={zone} explanation={data.explanation} snapshot={snap} />
          <Panel title="Intervenciones candidatas" subtitle="Reglas explícitas del catálogo técnico">
            <RecommendationList recommendations={data.recs} registered={zoneInterventions.map((i) => i.measureId)} onRegister={(r) => void register(r)} />
          </Panel>
          <Panel title={`Registros asociados (${data.members.length})`} subtitle="Siniestros fatales agrupados en la zona" className="overflow-hidden">
            <div className="-m-4 max-h-[420px] overflow-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead className="sticky top-0 bg-canvas text-muted"><tr>
                  {['Código', 'Fecha', 'Hora', 'Clase', 'Causa', 'Fallecidos', 'Vehículos'].map((h) => <th key={h} scope="col" className="px-3 py-2 text-left font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {data.members.map((m) =>
                  <tr key={m.codigo} className="border-t border-line">
                      <td className="px-3 py-2 font-mono">{m.codigo}</td>
                      <td className="px-3 py-2">{m.fecha}</td>
                      <td className="px-3 py-2">{m.hora ?? <span className="text-muted">—</span>}</td>
                      <td className="px-3 py-2">{m.clase ? titleCase(m.clase) : <span className="text-muted">Sin dato</span>}</td>
                      <td className="px-3 py-2">{m.causa ? titleCase(m.causa) : <span className="text-muted">Sin dato</span>}</td>
                      <td className="px-3 py-2 tabular-nums">{m.fallecidos ?? <span className="text-muted">Sin dato</span>}</td>
                      <td className="px-3 py-2">{m.tiposVehiculo.map(titleCase).join(', ') || <span className="text-muted">Sin vínculo</span>}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <aside className="grid content-start gap-6">
          <Panel title="Calidad y confianza del dato" subtitle="Independiente del IPIV"><QualitySummary report={data.quality} dense /></Panel>
          <Panel title="Entidad competente"><EntityPanel zone={zone} /></Panel>
          <Panel title="Seguimiento" subtitle={`${zoneInterventions.length} intervención(es) registradas`}>
            {zoneInterventions.length ?
            <ul className="grid gap-2 text-xs">
                {zoneInterventions.map((i) => <li key={i.id} className="flex justify-between gap-2"><span className="truncate">{i.measureId}</span><span className="whitespace-nowrap font-medium">{stateLabel[i.state]}</span></li>)}
              </ul> :
            <p className="text-xs text-muted">Sin intervenciones registradas para esta zona.</p>}
            <Link to="/seguimiento" className="mt-3 inline-block text-xs font-medium text-primary">Ir a Seguimiento →</Link>
          </Panel>
        </aside>
      </div>
    </main>);

}