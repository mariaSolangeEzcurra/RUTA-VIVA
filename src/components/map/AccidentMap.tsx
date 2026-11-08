import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { Circle, CircleMarker, LayerGroup, MapContainer, Marker, Popup, ScaleControl, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import { BASEMAPS } from './basemaps';
import type { SiniestroView, Zone } from '../../types/data';
import { categoryLabel } from '../../data/ipivConfig';
import { AREQUIPA_BBOX } from '../../utils/parsing';
import { pointHex, quarterInfo, quarterOf } from '../../utils/quarters';
import { titleCase } from '../../utils/text';
import { HeatmapLayer } from './HeatmapLayer';

export type MapMode = 'zonas' | 'puntos' | 'calor' | 'ambos';
export type ColorBy = 'prioridad' | 'trimestre';

interface AccidentMapProps {
  points: SiniestroView[];
  zones: Zone[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  focus: {lat: number;lon: number;zoom: number;key: number;} | null;
  fitPoints: {lat: number;lon: number;}[] | null;
  fitKey: string;
  mode: MapMode;
  colorBy: ColorBy;
  activeZoneId: string | null;
  onZoneSelect: (id: string | null) => void;
  basemap: string;
  onBasemapFail: (id: string) => void;
  showMinorZones: boolean;
}

const REGION_BOUNDS: [[number, number], [number, number]] = [[AREQUIPA_BBOX.minLat, AREQUIPA_BBOX.minLon], [AREQUIPA_BBOX.maxLat, AREQUIPA_BBOX.maxLon]];
const ZONE_SIZE = { muy_alta: 36, alta: 31, media: 25, baja: 21 } as const;
const ZONE_WEIGHT = { muy_alta: 4, alta: 3, media: 2, baja: 1 } as const;

function MapController({ focus, fitPoints, fitKey }: Pick<AccidentMapProps, 'focus' | 'fitPoints' | 'fitKey'>) {
  const map = useMap();
  useEffect(() => {
    if (fitPoints && fitPoints.length > 0) {
      const lats = fitPoints.map((p) => p.lat);
      const lons = fitPoints.map((p) => p.lon);
      map.fitBounds([[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]], { padding: [40, 40], maxZoom: 14 });
    } else {
      map.fitBounds(REGION_BOUNDS, { padding: [10, 10] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lon], focus.zoom, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

/** Ajusta el mapa cuando cambia el tamaño de su contenedor (paneles que se abren o cierran). */
function SizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/** Al elegir una zona en la lista: vuela hasta ella y abre su ficha. */
function ZoneFocus({ zone, markers }: { zone: Zone | null; markers: React.MutableRefObject<Map<string, LeafletMarker>> }) {
  const map = useMap();
  useEffect(() => {
    if (!zone) return;
    map.flyTo(zone.centroid, Math.max(map.getZoom(), 14), { duration: 0.9 });
    const t = window.setTimeout(() => markers.current.get(zone.id)?.openPopup(), 950);
    return () => window.clearTimeout(t);
  }, [zone, map, markers]);
  return null;
}

export function zoneIcon(z: Zone, active: boolean) {
  const size = ZONE_SIZE[z.category];
  const pulse = z.category === 'muy_alta' ? ' rv-zone--pulse' : '';
  return L.divIcon({
    className: 'rv-zone-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div class="rv-zone rv-zone--${z.category}${pulse}${active ? ' rv-zone--active' : ''}" style="font-size:${size > 28 ? 14 : 11}px"><span>${z.rank}</span></div>`
  });
}

function ZonePopup({ z }: { z: Zone }) {
  const color = pointHex[z.category];
  return (
    <div className="min-w-[220px] font-sans text-xs">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: color }}>{z.rank}</span>
        <div>
          <p className="text-sm font-bold leading-tight text-ink">{titleCase(z.distritos.join(', ') || 'Distrito sin dato')}</p>
          <p className="text-[11px] font-semibold" style={{ color }}>Prioridad {categoryLabel[z.category].toLowerCase()} · puesto {z.rank}</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-[11px] text-muted"><span>Índice IPIV</span><b className="text-ink">{z.ipiv} / 100</b></div>
        <div className="mt-0.5 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full" style={{ width: `${z.ipiv}%`, background: color }} /></div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        <div className="rounded-lg bg-canvas py-1"><p className="text-sm font-bold text-ink">{z.siniestros}</p><p className="text-[10px] text-muted">siniestros</p></div>
        <div className="rounded-lg bg-canvas py-1"><p className="text-sm font-bold text-ink">{z.fallecidos ?? '—'}</p><p className="text-[10px] text-muted">fallecidos</p></div>
        <div className="rounded-lg bg-canvas py-1"><p className="text-sm font-bold text-ink">{z.years.length}</p><p className="text-[10px] text-muted">años</p></div>
      </div>
      {z.dominantClass && <p className="mt-2 text-[11px] text-muted">Tipo más frecuente: <b className="text-ink">{titleCase(z.dominantClass.label)}</b></p>}
      <Link to={`/zona/${encodeURIComponent(z.id)}`} className="mt-2 flex h-8 items-center justify-center rounded-lg bg-primary text-xs font-bold !text-white">Ver detalle de la zona</Link>
    </div>);
}

/** Capa base con detección de fallos: si casi ningún mosaico carga, avisa para cambiar de proveedor. */
export function BaseTiles({ id, onFail }: { id: string; onFail: (id: string) => void }) {
  const bm = BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0];
  const stats = useRef({ ok: 0, err: 0, reported: false });
  useEffect(() => {stats.current = { ok: 0, err: 0, reported: false };}, [id]);
  return (
    <TileLayer key={bm.id} url={bm.url} attribution={bm.attribution} maxZoom={20} maxNativeZoom={bm.maxZoom} {...(bm.subdomains ? { subdomains: bm.subdomains } : {})}
      eventHandlers={{
        tileload: () => {stats.current.ok++;},
        tileerror: () => {
          const st = stats.current;
          st.err++;
          if (!st.reported && st.err >= 6 && st.ok === 0) {st.reported = true;onFail(bm.id);}
        }
      }} />);
}

export function AccidentMap({ points, zones, selectedCode, onSelect, focus, fitPoints, fitKey, mode, colorBy, activeZoneId, onZoneSelect, basemap, onBasemapFail, showMinorZones }: AccidentMapProps) {
  const markers = useRef(new Map<string, LeafletMarker>());
  const byPriority = useMemo(() => [...zones].sort((a, b) => ZONE_WEIGHT[a.category] - ZONE_WEIGHT[b.category] || b.rank - a.rank), [zones]);
  const priorityZones = byPriority.filter((z) => z.category === 'muy_alta' || z.category === 'alta');
  const otherZones = byPriority.filter((z) => z.category === 'media' || z.category === 'baja');
  const activeZone = zones.find((z) => z.id === activeZoneId) ?? null;
  const zonesFirst = mode === 'zonas';

  const zoneLayer = (z: Zone) => {
    const strong = z.category === 'muy_alta' || z.category === 'alta';
    const active = z.id === activeZoneId;
    return (
      <React.Fragment key={z.id}>
        <Circle center={z.centroid} radius={Math.max(z.radiusM, 150)} interactive={false}
          pathOptions={{ color: pointHex[z.category], weight: active ? 4 : strong ? 2.5 : 1.5, dashArray: strong ? undefined : '5 5', fillColor: pointHex[z.category], fillOpacity: zonesFirst ? strong ? 0.28 : 0.15 : strong ? 0.16 : 0.08 }} />
        <Marker position={z.centroid} icon={zoneIcon(z, active)} zIndexOffset={ZONE_WEIGHT[z.category] * 1000 - z.rank}
          ref={(m) => {if (m) markers.current.set(z.id, m);else markers.current.delete(z.id);}}
          eventHandlers={{ click: () => onZoneSelect(z.id), popupclose: () => {if (activeZoneId === z.id) onZoneSelect(null);} }}>
          <Tooltip direction="top" offset={[0, -ZONE_SIZE[z.category] / 2]}>#{z.rank} {titleCase(z.distritos[0] ?? 'Zona')} · {categoryLabel[z.category]}</Tooltip>
          <Popup autoPanPaddingTopLeft={[20, 20]} autoPanPaddingBottomRight={[20, 20]}><ZonePopup z={z} /></Popup>
        </Marker>
      </React.Fragment>);
  };

  const showPoints = mode !== 'calor';
  const styleFor = (p: SiniestroView, selected: boolean) => {
    let fill: string = pointHex.aislado;
    let stroke = '#ffffff';
    if (colorBy === 'trimestre') {
      const q = quarterOf(p.fecha);
      fill = q ? quarterInfo[q].color : '#94A3B8';
    } else if (p.zoneCategory) {
      fill = pointHex[p.zoneCategory];
    } else {
      stroke = '#075985';
    }
    if (zonesFirst && !selected) {
      return { color: '#ffffff', weight: 0.8, fillColor: colorBy === 'prioridad' && !p.zoneCategory ? '#64748B' : fill, fillOpacity: 0.55 };
    }
    return { color: selected ? '#0F2A3D' : stroke, weight: selected ? 3 : 1.5, fillColor: fill, fillOpacity: mode === 'ambos' ? 0.8 : 0.95 };
  };

  return (
    <MapContainer bounds={REGION_BOUNDS} preferCanvas className="h-full w-full" zoomControl={false} scrollWheelZoom>
      <MapController focus={focus} fitPoints={fitPoints} fitKey={fitKey} />
      <ZoneFocus zone={activeZone} markers={markers} />
      <SizeWatcher />
      <BaseTiles id={basemap} onFail={onBasemapFail} />
      {showMinorZones && <LayerGroup>{otherZones.map(zoneLayer)}</LayerGroup>}
      <LayerGroup>{priorityZones.map(zoneLayer)}</LayerGroup>
      <ZoomControl position="topright" />
      <ScaleControl position="topright" imperial={false} maxWidth={90} />
      {(mode === 'calor' || mode === 'ambos') && <HeatmapLayer points={points} />}
      {showPoints &&
      <LayerGroup>
          {points.map((p) => {
          const selected = p.codigo === selectedCode;
          const q = quarterOf(p.fecha);
          return (
            <CircleMarker
              key={`${p.codigo}-${colorBy}-${mode}`}
              center={[p.lat as number, p.lon as number]}
              radius={selected ? 9 : zonesFirst ? 3.5 : mode === 'ambos' ? 4.5 : 6}
              pathOptions={styleFor(p, selected)}
              eventHandlers={{ click: () => onSelect(p.codigo) }}>
                <Tooltip direction="top" offset={[0, -4]}>{p.codigo} · {p.fecha ?? 'sin fecha'}{q ? ` (T${q})` : ''} · {p.clase ?? 'sin clase'}</Tooltip>
              </CircleMarker>);
        })}
        </LayerGroup>
      }
    </MapContainer>);

}
