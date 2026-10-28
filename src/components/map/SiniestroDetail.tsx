import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CrosshairIcon, FileDownIcon, ListIcon, MapPinnedIcon, XIcon } from 'lucide-react';
import type { SiniestroView, Zone } from '../../types/data';
import { coordStatusLabel } from '../../utils/parsing';
import { countBy } from '../../utils/metrics';
import { formatDateTime, formatInt, titleCase } from '../../utils/text';
import { PriorityBadge } from '../ui/PriorityBadge';
import { Button } from '../ui/Button';

interface SiniestroDetailProps {
  item: SiniestroView;
  zone: Zone | null;
  dataVersion: number;
  processedAt: string | null;
  onClose: () => void;
  onCenter: () => void;
  onFicha: (() => void) | null;
}

function Row({ label, value }: {label: string;value: React.ReactNode;}) {
  const missing = value === null || value === undefined || value === '';
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1 text-xs">
      <dt className="text-muted">{label}</dt>
      <dd className={missing ? 'italic text-muted' : 'text-ink'}>{missing ? 'Sin dato' : value}</dd>
    </div>);

}

function Section({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <section className="border-b border-line px-4 py-3">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-navy">{title}</h3>
      <dl>{children}</dl>
    </section>);

}

export function SiniestroDetail({ item, zone, dataVersion, processedAt, onClose, onCenter, onFicha }: SiniestroDetailProps) {
  const [full, setFull] = useState(false);
  const fields: [string, unknown][] = [
  ['codigo', item.codigo], ['fecha', item.fecha], ['anio', item.anio], ['hora', item.hora], ['departamento', item.departamento], ['provincia', item.provincia],
  ['distrito', item.distrito], ['direccion', item.direccion], ['via', item.via], ['redVial', item.redVial], ['kilometro', item.kilometro], ['lat', item.lat], ['lon', item.lon],
  ['clase', item.clase], ['causa', item.causa], ['fallecidosFuente', item.fallecidosFuente], ['lesionadosFuente', item.lesionadosFuente], ['vehiculosFuente', item.vehiculosFuente]];

  const missing = fields.filter(([, v]) => v === null).map(([k]) => k);
  const userProfile = countBy(item.personas, (p) => p.tipoUsuario);
  const conditions = countBy(item.personas, (p) => p.condicion);
  const vehTypes = countBy(item.vehiculos, (v) => v.tipo);
  const services = countBy(item.vehiculos, (v) => v.servicio);

  return (
    <aside aria-label={`Ficha del siniestro ${item.codigo}`} className="flex h-full flex-col bg-surface">
      <header className="flex items-start justify-between gap-2 border-b border-line bg-navy px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-[11px] text-white/70">Siniestro fatal{item.preliminar ? ' · dato preliminar' : ''}</p>
          <h2 className="truncate font-mono text-sm font-medium">{item.codigo}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar ficha" className="rounded p-1 hover:bg-white/10"><XIcon className="h-4 w-4" /></button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Section title="Identificación">
          <Row label="Fecha y hora" value={`${item.fecha ?? 'Sin fecha'}${item.hora ? ` · ${item.hora}` : ' · hora sin dato'}`} />
          <Row label="Clase" value={item.clase && titleCase(item.clase)} />
          <Row label="Causa registrada" value={item.causa && titleCase(item.causa)} />
          <Row label="Fuente" value={item.source.declaredSource} />
        </Section>
        <Section title="Ubicación">
          <Row label="Departamento" value={item.departamento && titleCase(item.departamento)} />
          <Row label="Provincia" value={item.provincia && titleCase(item.provincia)} />
          <Row label="Distrito" value={item.distrito && titleCase(item.distrito)} />
          <Row label="Coordenadas" value={item.lat !== null && item.lon !== null ? <span className="font-mono">{item.lat.toFixed(6)}, {item.lon.toFixed(6)}</span> : null} />
          <Row label="Referencia" value={item.direccion} />
          <Row label="Vía / ruta" value={item.via ? `${item.via} (registrada en la fuente, no verificada con red oficial)` : null} />
          <Row label="Red vial" value={item.redVial} />
          <Row label="Kilómetro" value={item.kilometro ? `${item.kilometro} (según registro)` : null} />
        </Section>
        <Section title="Consecuencias">
          <Row label="Fallecidos" value={item.fallecidos === null ? null : `${item.fallecidos} (${item.fallecidosOrigen === 'personas' ? 'personas vinculadas' : 'registro del siniestro'})`} />
          <Row label="Lesionados" value={item.lesionados === null ? null : `${item.lesionados} (${item.lesionadosOrigen === 'personas' ? 'personas vinculadas' : 'registro del siniestro'})`} />
          {item.conteoDiscrepante && <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-[11px] text-[#7a3d06]">El conteo de fallecidos del registro ({item.fallecidosFuente}) difiere del de personas vinculadas ({item.fallecidos}).</p>}
          <Row label="Personas" value={item.personas.length ? `${item.personas.length} vinculadas` : null} />
          <Row label="Condición" value={conditions.length ? conditions.map((c) => `${titleCase(c.label)} (${c.value})`).join(', ') : null} />
          <Row label="Usuarios viales" value={userProfile.length ? userProfile.map((c) => `${titleCase(c.label)} (${c.value})`).join(', ') : null} />
        </Section>
        <Section title="Vehículos">
          <Row label="Cantidad" value={item.vehiculos.length ? `${item.vehiculos.length} vinculados` : item.vehiculosFuente !== null ? `${item.vehiculosFuente} (según registro)` : null} />
          <Row label="Tipos" value={vehTypes.length ? vehTypes.map((c) => `${titleCase(c.label)} (${c.value})`).join(', ') : null} />
          <Row label="Servicio" value={services.length ? services.map((c) => `${titleCase(c.label)} (${c.value})`).join(', ') : null} />
        </Section>
        <Section title="Calidad y trazabilidad">
          <Row label="Coordenadas" value={coordStatusLabel[item.coordStatus]} />
          <Row label="Personas" value={item.personas.length ? 'Vinculadas por código' : 'Sin vínculo'} />
          <Row label="Vehículos" value={item.vehiculos.length ? 'Vinculados por código' : 'Sin vínculo'} />
          <Row label="Campos faltantes" value={missing.length ? `${missing.length}: ${missing.join(', ')}` : 'Ninguno'} />
          <Row label="Origen" value={<span className="break-all">{item.source.file} · hoja {item.source.sheet} · registro {formatInt(item.source.row)}</span>} />
          <Row label="Procesado" value={`${formatDateTime(processedAt)} · datos v${dataVersion}`} />
        </Section>
        {zone &&
        <section className="border-b border-line px-4 py-3">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy">Zona relacionada</h3>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono">{zone.id}</span>
              <PriorityBadge category={zone.category} />
            </div>
            <p className="mt-1 text-xs text-muted">Puesto {zone.rank} · IPIV {zone.ipiv} · {zone.siniestros} siniestros</p>
          </section>
        }
        {full &&
        <section className="px-4 py-3">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy">Registro completo</h3>
            <table className="w-full text-[11px]">
              <tbody>
                {fields.map(([k, v]) =>
              <tr key={k} className="border-b border-line/70">
                    <th scope="row" className="py-1 pr-2 text-left font-mono font-normal text-muted">{k}</th>
                    <td className="py-1 font-mono">{v === null ? <span className="italic text-muted">null</span> : String(v)}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </section>
        }
      </div>
      <footer className="grid grid-cols-2 gap-2 border-t border-line p-3">
        <Button size="sm" variant="secondary" onClick={onCenter} disabled={item.coordStatus !== 'valida'}><CrosshairIcon className="h-3.5 w-3.5" />Centrar</Button>
        <Button size="sm" variant="secondary" onClick={() => setFull((f) => !f)}><ListIcon className="h-3.5 w-3.5" />{full ? 'Ocultar registro' : 'Registro completo'}</Button>
        {zone ?
        <Link to={`/zona/${encodeURIComponent(zone.id)}`} className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-line px-3 text-xs font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas"><MapPinnedIcon className="h-3.5 w-3.5" />Zona prioritaria</Link> :

        <span className="inline-flex h-8 items-center justify-center rounded-md border border-dashed border-line px-2 text-[11px] text-muted">Sin zona asociada</span>
        }
        <Button size="sm" onClick={onFicha ?? undefined} disabled={!onFicha}><FileDownIcon className="h-3.5 w-3.5" />Ficha técnica</Button>
      </footer>
    </aside>);

}