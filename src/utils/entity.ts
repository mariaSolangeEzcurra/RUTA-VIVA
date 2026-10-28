import type { EntityRecord, Zone } from '../types/data';
import { ENTITY_PENDING, entityRules } from '../data/entityRules';
import type { EntityRule } from '../data/entityRules';
import { normalizeText } from './text';

export interface EntityAssessment {
  label: string;
  confirmed: boolean;
  candidate: EntityRule | null;
  reason: string;
}

/** La entidad nunca se asigna por ubicación. Solo se sugiere a partir de la clasificación de red registrada y se exige confirmación. */
export function assessEntity(zone: Zone, record: EntityRecord | undefined): EntityAssessment {
  if (record && record.estado === 'confirmada' && record.entidad.trim()) {
    return { label: record.entidad, confirmed: true, candidate: null, reason: `Confirmada manualmente el ${new Date(record.updatedAt).toLocaleDateString('es-PE')}.` };
  }
  if (zone.redesViales.length === 0) {
    return { label: ENTITY_PENDING, confirmed: false, candidate: null, reason: 'La fuente no registra la clasificación de red vial y no hay capa del SINAC cargada.' };
  }
  const matches = zone.redesViales.map((r) => entityRules.find((rule) => rule.match.some((m) => normalizeText(r).includes(m))) ?? null);
  const distinct = Array.from(new Set(matches.map((m) => m?.candidate ?? 'sin regla')));
  if (distinct.length === 1 && matches[0]) {
    return { label: ENTITY_PENDING, confirmed: false, candidate: matches[0], reason: `Clasificación registrada en la fuente: ${zone.redesViales.join(', ')}. Debe verificarse con el SINAC.` };
  }
  return { label: ENTITY_PENDING, confirmed: false, candidate: null, reason: `Clasificaciones registradas no concluyentes (${zone.redesViales.join(', ')}).` };
}