import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { ConflictPolicy, DatasetKind, ImportLog } from '../types/data';
import { useData } from '../contexts/DataContext';
import { MAX_FILE_BYTES } from '../data/fieldSchemas';
import { autoMap, detectKind, parseWorkbook } from '../utils/excel';
import type { KindDetection, ParsedSheet, ParsedWorkbook } from '../utils/excel';
import { validateSheet } from '../utils/importValidation';
import type { ImportScope, ValidationResult, WideMetric } from '../utils/importValidation';
import { buildLog } from '../utils/importCommit';
import type { CommitMeta } from '../utils/importCommit';
import { normalizeText, uid } from '../utils/text';

export interface FileEntry {
  id: string;
  file: File;
  status: 'leyendo' | 'listo' | 'error' | 'importado';
  error?: string;
  workbook?: ParsedWorkbook;
}

export interface Draft {
  fileId: string;
  importId: string;
  sheetName: string;
  kind: DatasetKind;
  detection: KindDetection;
  mapping: Record<string, string | null>;
  declaredSource: string;
  period: string;
  preliminar: boolean;
  scope: ImportScope;
  wide: boolean;
  wideMetric: WideMetric;
  policy: ConflictPolicy;
  startedAt: string;
}

export type WizardStep = 'archivos' | 'mapeo' | 'validacion' | 'resultado';

function guessSource(name: string): string {
  const n = normalizeText(name);
  if (n.includes('ONSV') || n.includes('SINIESTROS')) return 'Observatorio Nacional de Seguridad Vial (ONSV) – MTC';
  return 'Fuente declarada por el usuario';
}

export function useImportWizard() {
  const { state, commit, appendLog } = useData();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<WizardStep>('archivos');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [result, setResult] = useState<ImportLog | null>(null);
  const [busy, setBusy] = useState(false);

  const addFiles = useCallback((list: FileList | File[]) => {
    Array.from(list).forEach((file) => {
      const id = uid('F');
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext !== 'xlsx' && ext !== 'xls') {
        setFiles((f) => [...f, { id, file, status: 'error', error: 'Formato no admitido. Solo .xlsx o .xls (no se aceptan libros con macros).' }]);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFiles((f) => [...f, { id, file, status: 'error', error: `El archivo supera el límite de ${MAX_FILE_BYTES / 1024 / 1024} MB.` }]);
        return;
      }
      setFiles((f) => [...f, { id, file, status: 'leyendo' }]);
      file.arrayBuffer().
      then((buf) => new Promise<ParsedWorkbook>((resolve, reject) => setTimeout(() => {
        try {resolve(parseWorkbook(buf, file.name, file.size));} catch (e) {reject(e);}
      }, 10))).
      then((wb) => setFiles((f) => f.map((x) => x.id === id ? { ...x, status: 'listo', workbook: wb } : x))).
      catch((e: unknown) => setFiles((f) => f.map((x) => x.id === id ? { ...x, status: 'error', error: e instanceof Error ? `No se pudo leer: ${e.message}` : 'Archivo malformado o ilegible.' } : x)));
    });
  }, []);

  const removeFile = (id: string) => {
    setFiles((f) => f.filter((x) => x.id !== id));
    if (draft?.fileId === id) {setDraft(null);setStep('archivos');setValidation(null);}
  };

  const currentFile = files.find((f) => f.id === draft?.fileId) ?? null;
  const currentSheet: ParsedSheet | null = currentFile?.workbook?.sheets.find((s) => s.name === draft?.sheetName) ?? null;

  const buildDraft = (entry: FileEntry, sheetName?: string, kindOverride?: DatasetKind): Draft | null => {
    const wb = entry.workbook;
    if (!wb) return null;
    const sheet = wb.sheets.find((s) => s.name === sheetName) ?? wb.sheets.find((s) => !s.empty) ?? wb.sheets[0];
    const detection = detectKind(sheet, entry.file.name);
    const kind = kindOverride ?? detection.kind;
    const period = entry.file.name.match(/(19|20)\d{2}\s*-\s*(19|20)\d{2}/)?.[0]?.replace(/\s/g, '') ?? '';
    return {
      fileId: entry.id, importId: uid('IMP'), sheetName: sheet.name, kind, detection, mapping: autoMap(kind, sheet.headers),
      declaredSource: draft?.fileId === entry.id ? draft.declaredSource : guessSource(entry.file.name),
      period: draft?.fileId === entry.id ? draft.period : period,
      preliminar: normalizeText(entry.file.name).includes('PRELIMINAR'),
      scope: 'region', wide: kind === 'historico' && sheet.yearColumns.length >= 3, wideMetric: 'siniestros', policy: 'conservar',
      startedAt: new Date().toISOString()
    };
  };

  const selectFile = (id: string) => {
    const entry = files.find((f) => f.id === id);
    if (!entry || entry.status !== 'listo') return;
    setDraft(buildDraft(entry));
    setValidation(null);
    setResult(null);
    setStep('mapeo');
  };

  const setSheet = (name: string) => {
    if (!currentFile) return;
    setDraft(buildDraft(currentFile, name));
    setValidation(null);
  };

  const setKind = (kind: DatasetKind) => {
    if (!currentFile || !draft) return;
    const d = buildDraft(currentFile, draft.sheetName, kind);
    if (d) setDraft({ ...d, declaredSource: draft.declaredSource, period: draft.period, preliminar: draft.preliminar });
    setValidation(null);
  };

  const update = (patch: Partial<Draft>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    setValidation(null);
  };

  const runValidation = () => {
    if (!draft || !currentSheet || !currentFile) return;
    setBusy(true);
    setTimeout(() => {
      try {
        const vr = validateSheet(currentSheet, draft.kind, draft.mapping, {
          importId: draft.importId, fileName: currentFile.file.name, sheetName: draft.sheetName, declaredSource: draft.declaredSource,
          preliminar: draft.preliminar, scope: draft.scope, wide: draft.wide, wideMetric: draft.wideMetric
        }, state);
        setValidation(vr);
        setStep('validacion');
      } catch (e) {
        toast.error(`La validación falló: ${e instanceof Error ? e.message : 'error desconocido'}`);
      } finally {
        setBusy(false);
      }
    }, 20);
  };

  const meta = (): CommitMeta | null => {
    if (!draft || !currentFile) return null;
    return {
      options: { importId: draft.importId, fileName: currentFile.file.name, sheetName: draft.sheetName, declaredSource: draft.declaredSource, preliminar: draft.preliminar, scope: draft.scope, wide: draft.wide, wideMetric: draft.wideMetric },
      fileSize: currentFile.file.size, period: draft.period || null, mapping: draft.mapping, startedAt: draft.startedAt
    };
  };

  const confirm = async () => {
    const m = meta();
    if (!m || !validation || !draft) return;
    setBusy(true);
    try {
      const log = await commit(validation, m, draft.policy);
      setResult(log);
      setFiles((f) => f.map((x) => x.id === draft.fileId ? { ...x, status: 'importado' } : x));
      setStep('resultado');
      toast.success(`Importación ${log.id} aplicada: datos v${log.dataVersion}.`);
    } catch (e) {
      const failed = buildLog(validation, m, { status: 'fallida', errors: [e instanceof Error ? e.message : 'Error al guardar'], nuevos: 0 });
      await appendLog(failed).catch(() => undefined);
      setResult(failed);
      setStep('resultado');
      toast.error('La importación falló y no se aplicó ningún cambio.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    const m = meta();
    if (m && validation) {
      await appendLog(buildLog(validation, m, { status: 'cancelada', nuevos: 0, warnings: [...validation.warnings, 'Cancelada por el usuario antes de aplicar cambios.'] })).catch(() => undefined);
      toast('Importación cancelada. No se modificaron los datos.');
    }
    setDraft(null);
    setValidation(null);
    setStep('archivos');
  };

  const restart = () => {
    setDraft(null);
    setValidation(null);
    setResult(null);
    setStep('archivos');
  };

  return { files, addFiles, removeFile, draft, step, setStep, currentFile, currentSheet, selectFile, setSheet, setKind, update, runValidation, validation, confirm, cancel, restart, result, busy };
}