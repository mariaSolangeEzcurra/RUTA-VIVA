import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { HeatLayer } from 'leaflet.heat';
import type { Layer } from 'leaflet';
import type { SiniestroView } from '../../types/data';
import { MAP_HEAT_GRADIENT } from '../../utils/quarters';

/** Capa de mapa de calor: cada siniestro pesa según sus fallecidos (mínimo 1). */
export function HeatmapLayer({ points }: { points: SiniestroView[] }) {
  const map = useMap();
  const layerRef = useRef<HeatLayer | null>(null);

  useEffect(() => {
    const layer = new HeatLayer([], { radius: 22, blur: 18, minOpacity: 0.35, max: 3, gradient: MAP_HEAT_GRADIENT, maxZoom: 13 });
    const asLayer = layer as unknown as Layer;
    map.addLayer(asLayer);
    layerRef.current = layer;
    return () => {
      map.removeLayer(asLayer);
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    layerRef.current?.setLatLngs(points.map((p) => [p.lat as number, p.lon as number, Math.max(1, p.fallecidos ?? 1)]));
  }, [points]);

  return null;
}
