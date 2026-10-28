import { useCallback } from 'react';
import { toast } from 'sonner';
import type { SiniestroView, Zone } from '../types/data';
import { useData } from '../contexts/DataContext';
import { downloadZonePdf } from '../utils/pdf';
import { explainZone } from '../utils/explain';
import { recommendForZone } from '../utils/recommend';
import { qualityReport } from '../utils/quality';
import { assessEntity } from '../utils/entity';

export function useZoneTools() {
  const { state, views } = useData();

  const getZone = useCallback((id: string | null | undefined): Zone | null => {
    if (!id) return null;
    return state.analysis?.zones.find((z) => z.id === id) ?? null;
  }, [state.analysis]);

  const membersOf = useCallback((zone: Zone): SiniestroView[] => {
    const codes = new Set(zone.memberCodes);
    return views.filter((v) => codes.has(v.codigo));
  }, [views]);

  const downloadFicha = useCallback((zone: Zone) => {
    const snapshot = state.analysis;
    if (!snapshot) {
      toast.error('No hay un análisis ejecutado para generar la ficha.');
      return;
    }
    try {
      const members = membersOf(zone);
      downloadZonePdf({
        zone, snapshot, members,
        explanation: explainZone(zone, snapshot),
        recommendations: recommendForZone(zone),
        quality: qualityReport(members),
        entity: assessEntity(zone, state.entities[zone.id]),
        interventions: state.interventions.filter((i) => i.zoneId === zone.id),
        dataVersion: state.dataVersion
      });
      toast.success(`Ficha de la zona ${zone.id} generada.`);
    } catch (e) {
      toast.error(`No se pudo generar la ficha: ${e instanceof Error ? e.message : 'error desconocido'}`);
    }
  }, [membersOf, state]);

  return { getZone, membersOf, downloadFicha };
}