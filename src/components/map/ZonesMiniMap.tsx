import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleMarker, MapContainer, Marker, Tooltip, useMap } from 'react-leaflet';
import type { Zone } from '../../types/data';
import { categoryLabel } from '../../data/ipivConfig';
import { pointHex } from '../../utils/quarters';
import { titleCase } from '../../utils/text';
import { BaseTiles, zoneIcon } from './AccidentMap';
import { DEFAULT_BASEMAP, FALLBACK_ORDER } from './basemaps';

function Fit({ zones }: { zones: Zone[] }) {
  const map = useMap();
  useEffect(() => {
    if (!zones.length) return;
    const lats = zones.map((z) => z.centroid[0]);
    const lons = zones.map((z) => z.centroid[1]);
    map.fitBounds([[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]], { padding: [36, 36], maxZoom: 12 });
  }, [zones, map]);
  return null;
}

/** Vista previa del mapa en Inicio: solo las zonas, numeradas por su puesto. Tocar una abre su detalle. */
export function ZonesMiniMap({ zones, height = 380 }: { zones: Zone[]; height?: number }) {
  const navigate = useNavigate();
  const [basemap, setBasemap] = useState(() => {
    try {return localStorage.getItem('rv-basemap') ?? DEFAULT_BASEMAP;} catch {return DEFAULT_BASEMAP;}
  });
  const tried = React.useRef(new Set<string>());
  const sorted = useMemo(() => [...zones].sort((a, b) => b.rank - a.rank), [zones]);
  return (
    <div className="overflow-hidden rounded-xl border border-line" style={{ height }}>
      <MapContainer center={[-16.4, -71.9]} zoom={8} className="h-full w-full" scrollWheelZoom={false} attributionControl>
        <BaseTiles id={basemap} onFail={(f) => {tried.current.add(f);const n = FALLBACK_ORDER.find((id) => !tried.current.has(id));if (n) setBasemap(n);}} />
        <Fit zones={zones} />
        {sorted.map((z) =>
        <React.Fragment key={z.id}>
            <CircleMarker center={z.centroid} radius={18} interactive={false} pathOptions={{ stroke: false, fillColor: pointHex[z.category], fillOpacity: 0.18 }} />
            <Marker position={z.centroid} icon={zoneIcon(z, false)} eventHandlers={{ click: () => navigate(`/zona/${encodeURIComponent(z.id)}`) }}>
              <Tooltip direction="top">#{z.rank} {titleCase(z.distritos[0] ?? 'Zona')} · {categoryLabel[z.category]} · IPIV {z.ipiv}</Tooltip>
            </Marker>
          </React.Fragment>
        )}
      </MapContainer>
    </div>);
}
