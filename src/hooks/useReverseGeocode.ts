import { useEffect, useState } from 'react';

export interface PlaceInfo {
  status: 'idle' | 'loading' | 'ok' | 'error';
  label: string | null;
  road: string | null;
}

interface NominatimResponse {
  display_name?: string;
  address?: Record<string, string>;
}

const cache = new Map<string, PlaceInfo>();
let lastCall = 0;

/** Referencia de lugar con Nominatim (OpenStreetMap). Uso moderado: caché y ≥ 1 s entre solicitudes. */
async function lookup(lat: number, lon: number): Promise<PlaceInfo> {
  const wait = Math.max(0, lastCall + 1100 - Date.now());
  lastCall = Date.now() + wait;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=es&lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as NominatimResponse;
  const a = data.address ?? {};
  const road = a.road ?? a.highway ?? null;
  const parts = [road, a.neighbourhood ?? a.suburb ?? a.hamlet, a.city ?? a.town ?? a.village ?? a.county].filter(Boolean);
  return { status: 'ok', road, label: parts.length ? parts.join(', ') : data.display_name ?? null };
}

export function useReverseGeocode(point: [number, number] | null | undefined): PlaceInfo {
  const key = point ? `${point[0].toFixed(4)},${point[1].toFixed(4)}` : null;
  const [info, setInfo] = useState<PlaceInfo>(() => key && cache.get(key) || { status: 'idle', label: null, road: null });

  useEffect(() => {
    if (!key || !point) {setInfo({ status: 'idle', label: null, road: null });return;}
    const hit = cache.get(key);
    if (hit) {setInfo(hit);return;}
    let alive = true;
    setInfo({ status: 'loading', label: null, road: null });
    lookup(point[0], point[1]).
    then((r) => {cache.set(key, r);if (alive) setInfo(r);}).
    catch(() => {if (alive) setInfo({ status: 'error', label: null, road: null });});
    return () => {alive = false;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return info;
}