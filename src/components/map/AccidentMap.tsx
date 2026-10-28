import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Circle, CircleMarker, LayerGroup, LayersControl, MapContainer, Popup, ScaleControl, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { SiniestroView, Zone } from '../../types/data';
import { categoryHex, categoryLabel } from '../../data/ipivConfig';
import { AREQUIPA_BBOX } from '../../utils/parsing';

interface AccidentMapProps {
  points: SiniestroView[];
  zones: Zone[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  focus: {lat: number;lon: number;zoom: number;key: number;} | null;
  fitPoints: {lat: number;lon: number;}[] | null;
  fitKey: string;
}

const REGION_BOUNDS: [[number, number], [number, number]] = [[AREQUIPA_BBOX.minLat, AREQUIPA_BBOX.minLon], [AREQUIPA_BBOX.maxLat, AREQUIPA_BBOX.maxLon]];

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
    if (focus) map.setView([focus.lat, focus.lon], focus.zoom, { animate: true });
  }, [focus, map]);
  return null;
}

export function AccidentMap({ points, zones, selectedCode, onSelect, focus, fitPoints, fitKey }: AccidentMapProps) {
  const priorityZones = zones.filter((z) => z.category === 'muy_alta' || z.category === 'alta');
  const otherZones = zones.filter((z) => z.category === 'media' || z.category === 'baja');
  const zoneCircle = (z: Zone, strong: boolean) =>
  <Circle key={z.id} center={z.centroid} radius={Math.max(z.radiusM, 80)} pathOptions={{ color: categoryHex[z.category], weight: strong ? 2.5 : 1.5, fillColor: categoryHex[z.category], fillOpacity: strong ? 0.18 : 0.1 }}>
      <Popup>
        <div className="min-w-[200px] text-xs">
          <p className="font-semibold">Zona {z.id}</p>
          <p className="text-muted">Puesto {z.rank} · IPIV {z.ipiv} · {categoryLabel[z.category]}</p>
          <p className="mt-1">{z.siniestros} siniestros · {z.fallecidos ?? 'sin dato de'} fallecidos · {z.years.length} año(s)</p>
          <Link to={`/zona/${encodeURIComponent(z.id)}`} className="mt-2 inline-block font-semibold text-primary">Ver detalle de la zona →</Link>
        </div>
      </Popup>
    </Circle>;


  return (
    <MapContainer bounds={REGION_BOUNDS} preferCanvas className="h-full w-full" zoomControl scrollWheelZoom>
      <MapController focus={focus} fitPoints={fitPoints} fitKey={fitKey} />
      <ScaleControl position="bottomright" imperial={false} />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>' maxZoom={19} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="CARTO claro">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' maxZoom={20} />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="Zonas prioritarias (alta y muy alta)">
          <LayerGroup>{priorityZones.map((z) => zoneCircle(z, true))}</LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Otras concentraciones (media y baja)">
          <LayerGroup>{otherZones.map((z) => zoneCircle(z, false))}</LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Siniestros individuales">
          <LayerGroup>
            {points.map((p) => {
              const selected = p.codigo === selectedCode;
              const inZone = !!p.zoneId;
              return (
                <CircleMarker
                  key={p.codigo}
                  center={[p.lat as number, p.lon as number]}
                  radius={selected ? 9 : 5}
                  pathOptions={inZone ?
                  { color: selected ? '#0E233D' : '#ffffff', weight: selected ? 3 : 1, fillColor: '#BE1228', fillOpacity: 0.9 } :
                  { color: selected ? '#0E233D' : '#4b5563', weight: selected ? 3 : 2, fillColor: '#ffffff', fillOpacity: 0.95 }}
                  eventHandlers={{ click: () => onSelect(p.codigo) }}>
                  
                  <Tooltip direction="top" offset={[0, -4]}>{p.codigo} · {p.fecha ?? 'sin fecha'} · {p.clase ?? 'sin clase'}</Tooltip>
                </CircleMarker>);

            })}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>);

}