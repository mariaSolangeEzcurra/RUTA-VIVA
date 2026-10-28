import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Intervention, InterventionState } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { allowedTransitions, compareBeforeAfter, stateLabel, statesRequiringNote, transition } from '../../utils/interventions';
import { formatDateTime, formatInt } from '../../utils/text';
import { Button } from '../ui/Button';

export function InterventionEditor({ iv }: {iv: Intervention;}) {
  const { saveIntervention, views } = useData();
  const options = allowedTransitions[iv.state];
  const [to, setTo] = useState<InterventionState | ''>(options[0] ?? '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entity, setEntity] = useState(iv.entity ?? '');
  const [responsable, setResponsable] = useState(iv.responsable ?? '');
  const [doc, setDoc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ba = useMemo(() => compareBeforeAfter(iv, views), [iv, views]);

  const applyTransition = async () => {
    if (!to) return;
    try {
      const next = transition(iv, to, note, date);
      await saveIntervention(next);
      setNote('');
      setError(null);
      setTo(allowedTransitions[next.state][0] ?? '');
      toast.success(`Estado actualizado: ${stateLabel[next.state]}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
    }
  };

  const saveMeta = async () => {
    await saveIntervention({ ...iv, entity: entity.trim() || null, responsable: responsable.trim() || null });
    toast.success('Datos de responsabilidad guardados.');
  };

  const addDoc = async () => {
    if (!doc.trim()) return;
    await saveIntervention({ ...iv, documents: [...iv.documents, doc.trim()] });
    setDoc('');
  };

  return (
    <div className="grid gap-6">
      <div>
        <p className="font-mono text-xs text-muted">{iv.measureId} · {iv.id}</p>
        <h2 className="mt-1 text-lg font-semibold">{iv.measureLabel}</h2>
        <Link to={`/zona/${encodeURIComponent(iv.zoneId)}`} className="text-sm text-primary">{iv.zoneLabel}</Link>
        <p className="mt-2 text-xs text-muted">{iv.observations}</p>
      </div>

      <section aria-label="Cambiar estado" className="rounded-md border border-line p-4">
        <h3 className="text-sm font-semibold">Estado actual: {stateLabel[iv.state]}</h3>
        {options.length === 0 ? <p className="mt-2 text-xs text-muted">Estado final. No admite más transiciones.</p> :
        <div className="mt-3 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="to" className="mb-1 block text-xs font-medium text-muted">Nuevo estado</label>
                <select id="to" value={to} onChange={(e) => setTo(e.target.value as InterventionState)} className="h-9 w-full rounded-md border border-line bg-surface px-2 text-sm">
                  {options.map((o) => <option key={o} value={o}>{stateLabel[o]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="mb-1 block text-xs font-medium text-muted">Fecha efectiva</label>
                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-full rounded-md border border-line px-2 text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="note" className="mb-1 block text-xs font-medium text-muted">Observación o sustento {to && statesRequiringNote.includes(to) ? '(obligatorio)' : '(opcional)'}</label>
              <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border border-line px-2 py-1.5 text-sm" placeholder="Informe de inspección, resolución, acta…" />
            </div>
            {error && <p role="alert" className="text-xs text-fatal">{error}</p>}
            <div><Button size="sm" onClick={() => void applyTransition()}>Registrar cambio de estado</Button></div>
          </div>
        }
      </section>

      <section aria-label="Responsabilidad" className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="iv-ent" className="mb-1 block text-xs font-medium text-muted">Entidad responsable</label>
          <input id="iv-ent" value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="Entidad competente por verificar" className="h-9 w-full rounded-md border border-line px-2 text-sm" />
        </div>
        <div>
          <label htmlFor="iv-resp" className="mb-1 block text-xs font-medium text-muted">Responsable</label>
          <input id="iv-resp" value={responsable} onChange={(e) => setResponsable(e.target.value)} className="h-9 w-full rounded-md border border-line px-2 text-sm" />
        </div>
        <div className="sm:col-span-2"><Button size="sm" variant="secondary" onClick={() => void saveMeta()}>Guardar responsabilidad</Button></div>
      </section>

      <section aria-label="Documentación">
        <h3 className="mb-2 text-sm font-semibold">Documentación</h3>
        {iv.documents.length ? <ul className="mb-2 grid gap-1 text-xs">{iv.documents.map((d, i) => <li key={`${d}-${i}`} className="break-all">• {d}</li>)}</ul> : <p className="mb-2 text-xs text-muted">Sin documentos referenciados.</p>}
        <div className="flex gap-2">
          <input aria-label="Referencia de documento" value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="N.º de informe, oficio o enlace verificable" className="h-9 flex-1 rounded-md border border-line px-2 text-sm" />
          <Button size="sm" variant="secondary" onClick={() => void addDoc()} className="h-9"><PlusIcon className="h-3.5 w-3.5" />Añadir</Button>
        </div>
      </section>

      <section aria-label="Comparación antes y después">
        <h3 className="mb-2 text-sm font-semibold">Comparación antes / después</h3>
        {ba.status === 'ok' && ba.before && ba.after ?
        <div>
            <div className="grid grid-cols-2 gap-3">
              {[['Antes', ba.before], ['Después', ba.after]].map(([l, p]) => {
              const per = p as NonNullable<typeof ba.before>;
              return (
                <div key={l as string} className="rounded-md bg-canvas p-3">
                    <p className="text-xs text-muted">{l as string} · {per.from} a {per.to}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{formatInt(per.siniestros)} <span className="text-xs font-normal text-muted">siniestros</span></p>
                    <p className="text-xs text-muted">{per.fallecidos === null ? 'Fallecidos sin dato' : `${per.fallecidos} fallecidos`}</p>
                  </div>);

            })}
            </div>
            <p className="mt-2 text-[11px] text-muted">Ventanas simétricas de {ba.windowDays} días. {ba.reason}</p>
          </div> :
        <p className="text-xs text-muted">{ba.reason}</p>}
      </section>

      <section aria-label="Historial">
        <h3 className="mb-2 text-sm font-semibold">Historial de estados</h3>
        <ol className="grid gap-3 border-l border-line pl-4">
          {[...iv.history].reverse().map((h, i) =>
          <li key={`${h.at}-${i}`} className="relative text-xs">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-navy" aria-hidden />
              <p className="font-medium">{h.from ? `${stateLabel[h.from]} → ` : ''}{stateLabel[h.to]}</p>
              <p className="text-muted">Efectiva {h.effectiveDate} · registrada {formatDateTime(h.at)}</p>
              {h.note && <p className="mt-0.5">{h.note}</p>}
            </li>
          )}
        </ol>
      </section>
    </div>);

}