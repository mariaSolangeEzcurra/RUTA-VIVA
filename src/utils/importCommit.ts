import type { AnyRecord, Conflict, ConflictPolicy, DatasetKind, ImportLog, StoreState } from '../types/data';
import type { ImportOptions, ValidationResult } from './importValidation';
import { recordKey } from './importValidation';
import { uid } from './text';

export interface CommitMeta {
  options: ImportOptions;
  fileSize: number;
  period: string | null;
  mapping: Record<string, string | null>;
  startedAt: string;
}

export function buildLog(vr: ValidationResult, meta: CommitMeta, partial: Partial<ImportLog>): ImportLog {
  return {
    id: meta.options.importId,
    fileName: meta.options.fileName,
    fileSize: meta.fileSize,
    sheet: meta.options.sheetName,
    kind: vr.kind,
    declaredSource: meta.options.declaredSource,
    period: meta.period,
    preliminar: meta.options.preliminar,
    startedAt: meta.startedAt,
    finishedAt: new Date().toISOString(),
    read: vr.read,
    nuevos: 0,
    actualizados: 0,
    duplicados: vr.duplicadosArchivo + vr.duplicadosExistentes,
    rechazados: vr.rechazados,
    pendientes: vr.pendientes,
    fueraAmbito: vr.fueraAmbito,
    conflictos: 0,
    warnings: vr.warnings,
    errors: [],
    status: 'completada',
    dataVersion: null,
    issuesSample: vr.issues.slice(0, 500),
    mapping: meta.mapping,
    ...partial
  };
}

/**
 * Aplica una importación validada de forma atómica: construye un estado nuevo y solo lo devuelve
 * si la persistencia termina sin error. Ante un fallo, el estado anterior queda intacto.
 */
export async function commitImport(
state: StoreState,
vr: ValidationResult,
meta: CommitMeta,
policy: ConflictPolicy,
persist: (s: StoreState) => Promise<void>)
: Promise<{state: StoreState;log: ImportLog;}> {
  const kind: DatasetKind = vr.kind;
  const list = [...(state[kind] as AnyRecord[])];
  const index = new Map<string, number>(list.map((r, i) => [recordKey(kind, r), i]));
  const conflicts: Conflict[] = [];
  let actualizados = 0;

  for (const rec of vr.toInsert) {
    const k = recordKey(kind, rec);
    if (index.has(k)) continue;
    index.set(k, list.length);
    list.push(rec);
  }

  for (const c of vr.conflicts) {
    const i = index.get(c.key);
    if (i === undefined) continue;
    const current = { ...(list[i] as unknown as Record<string, unknown>) };
    let changed = false;
    for (const d of c.diffs) {
      const apply = policy === 'sobrescribir' || policy === 'completar' && d.fillable;
      if (apply) {
        current[d.field] = d.incomingValue;
        changed = true;
      }
      if (!d.fillable || policy === 'conservar') {
        conflicts.push({
          id: uid('CF'), importId: meta.options.importId, kind, key: c.key, field: d.field,
          existing: d.existing, incoming: d.incoming, incomingValue: d.incomingValue,
          resolution: apply ? 'actualizado' : 'pendiente'
        });
      }
    }
    if (changed) {
      list[i] = current as unknown as AnyRecord;
      actualizados++;
    }
  }

  const nextVersion = state.dataVersion + 1;
  const log = buildLog(vr, meta, {
    nuevos: vr.toInsert.length,
    actualizados,
    conflictos: conflicts.length,
    status: vr.issues.length || conflicts.length || vr.rechazados ? 'completada_con_observaciones' : 'completada',
    dataVersion: nextVersion
  });

  const next: StoreState = {
    ...state,
    [kind]: list,
    conflicts: [...state.conflicts, ...conflicts],
    imports: [log, ...state.imports],
    dataVersion: nextVersion,
    lastProcessedAt: log.finishedAt
  };
  await persist(next);
  return { state: next, log };
}

/** Resuelve un conflicto pendiente aplicando o descartando el valor entrante. */
export function resolveConflict(state: StoreState, conflictId: string, apply: boolean): StoreState {
  const c = state.conflicts.find((x) => x.id === conflictId);
  if (!c || c.resolution !== 'pendiente') return state;
  const conflicts = state.conflicts.map((x) => x.id === conflictId ? { ...x, resolution: apply ? 'actualizado' as const : 'conservado' as const } : x);
  if (!apply) return { ...state, conflicts };
  const list = (state[c.kind] as AnyRecord[]).map((r) => {
    if (recordKey(c.kind, r) !== c.key) return r;
    return { ...(r as unknown as Record<string, unknown>), [c.field]: c.incomingValue } as unknown as AnyRecord;
  });
  return { ...state, [c.kind]: list, conflicts, dataVersion: state.dataVersion + 1, lastProcessedAt: new Date().toISOString() };
}