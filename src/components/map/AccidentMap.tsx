import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Circle, CircleMarker, LayerGroup, LayersControl, MapContainer, Popup, ScaleControl, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import type { SiniestroView, Zone } from '../../types/data';
import { categoryLabel } from '../../data/ipivConfig';
import { AREQUIPA_BBOX } from '../../utils/parsing';
import { pointHex, quarterInfo, quarterOf } from '../../utils/quarters';
import { HeatmapLayer } from './HeatmapLayer';

export type MapMode = 'puntos' | 'calor' | 'ambos';
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

export function AccidentMap({ points, zones, selectedCode, onSelect, focus, fitPoints, fitKey, mode, colorBy }: AccidentMapProps) {
  const priorityZones = zones.filter((z) => z.category === 'muy_alta' || z.category === 'alta');
  const otherZones = zones.filter((z) => z.category === 'media' || z.category === 'baja');
  const zoneCircle = (z: Zone, strong: boolean) =>
  <Circle key={z.id} center={z.centroid} radius={Math.max(z.radiusM, 80)} pathOptions={{ color: pointHex[z.category], weight: strong ? 2.5 : 1.5, dashArray: strong ? undefined : '4 4', fillColor: pointHex[z.category], fillOpacity: strong ? 0.16 : 0.08 }}>
      <Popup>
        <div className="min-w-[200px] text-xs">
          <p className="font-semibold">Zona {z.id}</p>
          <p className="text-muted">Puesto {z.rank} · IPIV {z.ipiv} · {categoryLabel[z.category]}</p>
          <p className="mt-1">{z.siniestros} siniestros · {z.fallecidos ?? 'sin dato de'} fallecidos · {z.years.length} año(s)</p>
          <Link to={`/zona/${encodeURIComponent(z.id)}`} className="mt-2 inline-block font-semibold text-primary">Ver detalle de la zona →</Link>
        </div>
      </Popup>
    </Circle>;


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
    return { color: selected ? '#0E233D' : stroke, weight: selected ? 3 : 1.5, fillColor: fill, fillOpacity: mode === 'ambos' ? 0.8 : 0.95 };
  };

  return (
    <MapContainer bounds={REGION_BOUNDS} preferCanvas className="h-full w-full" zoomControl={false} scrollWheelZoom>
      <MapController focus={focus} fitPoints={fitPoints} fitKey={fitKey} />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Claro (recomendado)">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' maxZoom={20} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>' maxZoom={19} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Oscuro (resalta el calor)">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' maxZoom={20} />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="Zonas prioritarias (alta y muy alta)">
          <LayerGroup>{priorityZones.map((z) => zoneCircle(z, true))}</LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Otras concentraciones (media y baja)">
          <LayerGroup>{otherZones.map((z) => zoneCircle(z, false))}</LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
      <ZoomControl position="topright" />
      <ScaleControl position="topright" imperial={false} maxWidth={90} />
      {mode !== 'puntos' && <HeatmapLayer points={points} />}
      {showPoints &&
      <LayerGroup>
          {points.map((p) => {
          const selected = p.codigo === selectedCode;
          const q = quarterOf(p.fecha);
          return (
            <CircleMarker
              key={`${p.codigo}-${colorBy}-${mode}`}
              center={[p.lat as number, p.lon as number]}
              radius={selected ? 9 : mode === 'ambos' ? 4.5 : 6}
              pathOptions={styleFor(p, selected)}
              eventHandlers={{ click: () => onSelect(p.codigo) }}>
                <Tooltip direction="top" offset={[0, -4]}>{p.codigo} · {p.fecha ?? 'sin fecha'}{q ? ` (T${q})` : ''} · {p.clase ?? 'sin clase'}</Tooltip>
              </CircleMarker>);
        })}
        </LayerGroup>
      }
    </MapContainer>);

}
