import React, { useState } from 'react';
import type { EntityRecord, EntityStatus, Zone } from '../../types/data';
import { useData } from '../../contexts/DataContext';
import { assessEntity } from '../../utils/entity';
import { Button } from '../ui/Button';

const statusLabel: Record<EntityStatus, string> = { por_verificar: 'Por verificar', en_evaluacion: 'En evaluación', confirmada: 'Confirmada' };

export function EntityPanel({ zone }: {zone: Zone;}) {
  const { state, saveEntity } = useData();
  const record = state.entities[zone.id];
  const a = assessEntity(zone, record);
  const [form, setForm] = useState<EntityRecord>(record ?? { zoneId: zone.id, entidad: '', responsable: '', estado: 'por_verificar', nota: '', updatedAt: '' });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.estado === 'confirmada' && (!form.entidad.trim() || !form.nota.trim())) {
      setError('Para confirmar, indique la entidad y el sustento (p. ej., resolución o consulta al SINAC).');
      return;
    }
    setError(null);
    await saveEntity({ ...form, entidad: form.entidad.trim(), responsable: form.responsable.trim(), nota: form.nota.trim(), updatedAt: new Date().toISOString() });
  };

  return (
    <div>
      <p className={`text-base font-semibold ${a.confirmed ? 'text-ok' : 'text-warn'}`}>{a.label}</p>
      <p className="mt-1 text-xs text-muted">{a.reason}</p>
      {a.candidate &&
      <dl className="mt-3 grid gap-1 rounded-md bg-canvas p-3 text-xs">
          <div><dt className="inline text-muted">Red registrada: </dt><dd className="inline">{a.candidate.network}</dd></div>
          <div><dt className="inline text-muted">Entidad candidata: </dt><dd className="inline font-medium">{a.candidate.candidate}</dd></div>
          <div><dt className="inline text-muted">Fiscalización: </dt><dd className="inline">{a.candidate.enforcement}</dd></div>
          <div><dt className="inline text-muted">Base normativa: </dt><dd className="inline">{a.candidate.legalBasis}</dd></div>
        </dl>
      }
      <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-3 border-t border-line pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ent" className="mb-1 block text-xs font-medium text-muted">Entidad</label>
            <input id="ent" value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} className="h-9 w-full rounded-md border border-line px-2 text-sm" placeholder={a.candidate?.candidate ?? 'Nombre de la entidad'} />
          </div>
          <div>
            <label htmlFor="resp" className="mb-1 block text-xs font-medium text-muted">Responsable institucional</label>
            <input id="resp" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} className="h-9 w-full rounded-md border border-line px-2 text-sm" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <div>
            <label htmlFor="est" className="mb-1 block text-xs font-medium text-muted">Estado de verificación</label>
            <select id="est" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as EntityStatus })} className="h-9 w-full rounded-md border border-line bg-surface px-2 text-sm">
              {(Object.keys(statusLabel) as EntityStatus[]).map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nota" className="mb-1 block text-xs font-medium text-muted">Sustento / nota</label>
            <input id="nota" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} className="h-9 w-full rounded-md border border-line px-2 text-sm" />
          </div>
        </div>
        {error && <p role="alert" className="text-xs text-fatal">{error}</p>}
        <div><Button type="submit" size="sm" variant="secondary">Guardar entidad</Button></div>
      </form>
    </div>);

}