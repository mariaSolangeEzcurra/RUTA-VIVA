import { useCallback, useMemo } from 'react';
import type { Zone } from '../types/data';
import { useData } from '../contexts/DataContext';
import { analyzeTemporal, datasetCoverage } from '../utils/temporal';
import type { ZoneMonthRow } from '../components/temporal/ZoneMonthMatrix';

/** Cobertura temporal de toda la región y perfiles mensuales por zona, reutilizados por Patrones y Ranking. */
export function useZoneTemporal(zones: Zone[]) {
  const { views } = useData();
  const coverage = useMemo(() => datasetCoverage(views), [views]);
  const byCode = useMemo(() => new Map(views.map((v) => [v.codigo, v])), [views]);
  const rows = useMemo<ZoneMonthRow[]>(() => zones.map((z) => {
    const members = z.memberCodes.map((c) => byCode.get(c)).filter((v): v is NonNullable<typeof v> => !!v);
    const t = analyzeTemporal(members, coverage);
    return { zone: z, label: z.distritos[0] ?? z.provincias[0] ?? z.id, months: t.months, peak: t.peak?.month ?? null };
  }), [zones, byCode, coverage]);
  const membersOf = useCallback((z: Zone) => z.memberCodes.map((c) => byCode.get(c)).filter((v): v is NonNullable<typeof v> => !!v), [byCode]);
  return { coverage, rows, membersOf };
}