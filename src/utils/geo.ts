/** Radio medio terrestre (IUGG) en metros. Distancias calculadas sobre la esfera, nunca en grados. */
export const EARTH_RADIUS_M = 6371008.8;

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface GeoPoint {
  id: string;
  lat: number;
  lon: number;
}

/**
 * DBSCAN con distancia haversine (metros). Índice de rejilla para limitar comparaciones.
 * Devuelve una etiqueta por punto: -1 = ruido (siniestro aislado), 0..k = concentración.
 */
export function dbscan(points: GeoPoint[], epsM: number, minPts: number): number[] {
  const n = points.length;
  const labels = new Array<number>(n).fill(-2);
  if (n === 0) return [];
  const maxAbsLat = Math.max(...points.map((p) => Math.abs(p.lat)));
  const cellLat = epsM / 111320;
  const cellLon = epsM / (111320 * Math.max(0.1, Math.cos(maxAbsLat * Math.PI / 180)));
  const grid = new Map<string, number[]>();
  const cellOf = (p: GeoPoint) => [Math.floor(p.lat / cellLat), Math.floor(p.lon / cellLon)];
  points.forEach((p, i) => {
    const [a, b] = cellOf(p);
    const k = `${a}:${b}`;
    const arr = grid.get(k);
    if (arr) arr.push(i);else
    grid.set(k, [i]);
  });
  const neighbors = (i: number): number[] => {
    const p = points[i];
    const [a, b] = cellOf(p);
    const out: number[] = [];
    for (let da = -1; da <= 1; da++) {
      for (let db = -1; db <= 1; db++) {
        const arr = grid.get(`${a + da}:${b + db}`);
        if (!arr) continue;
        for (const j of arr) if (haversine(p.lat, p.lon, points[j].lat, points[j].lon) <= epsM) out.push(j);
      }
    }
    return out;
  };
  let cluster = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue;
    const nb = neighbors(i);
    if (nb.length < minPts) {
      labels[i] = -1;
      continue;
    }
    labels[i] = cluster;
    const queue = nb.filter((j) => j !== i);
    while (queue.length) {
      const j = queue.shift() as number;
      if (labels[j] === -1) labels[j] = cluster;
      if (labels[j] !== -2) continue;
      labels[j] = cluster;
      const nbj = neighbors(j);
      if (nbj.length >= minPts) queue.push(...nbj);
    }
    cluster++;
  }
  return labels;
}

export function centroidOf(points: {lat: number;lon: number;}[]): [number, number] {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lon = points.reduce((s, p) => s + p.lon, 0) / points.length;
  return [lat, lon];
}

export function nearAny(lat: number, lon: number, points: {lat: number;lon: number;}[], epsM: number): boolean {
  return points.some((p) => haversine(lat, lon, p.lat, p.lon) <= epsM);
}