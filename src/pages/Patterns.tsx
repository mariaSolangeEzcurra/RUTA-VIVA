import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterPanel } from '../components/filters/FilterPanel';
import { BarList } from '../components/charts/BarList';
import { HourChart } from '../components/charts/HourChart';
import { PersistenceMatrix } from '../components/charts/PersistenceMatrix';
import { countBy, computeTotals } from '../utils/metrics';
import { weekdayOf, weekdays } from '../utils/parsing';
import { formatInt, formatPct, titleCase } from '../utils/text';
import type { Filters } from '../types/data';

function ageGroup(e: number | null): string | null {
  if (e === null) return null;
  if (e < 18) return '0–17 años';
  if (e < 30) return '18–29 años';
  if (e < 45) return '30–44 años';
  if (e < 65) return '45–64 años';
  return '65 años o más';
}

export function Patterns() {
  const { filtered, views, filters, setFilters, state } = useData();
  const toggle = (k: keyof Filters, v: string) => setFilters({ ...filters, [k]: filters[k] === v ? null : v, ...(k === 'provincia' ? { distrito: null } : {}) });

  const d = useMemo(() => {
    const personas = filtered.flatMap((v) => v.personas);
    const provinces = Array.from(new Set(filtered.map((v) => v.provincia).filter((x): x is string => !!x)));
    return {
      provincia: countBy(filtered, (v) => v.provincia),
      distrito: countBy(filtered, (v) => v.distrito),
      clase: countBy(filtered, (v) => v.clase),
      causa: countBy(filtered, (v) => v.causa),
      dia: countBy(filtered, (v) => {const w = weekdayOf(v.fecha);return w === null ? null : weekdays[w];}),
      vehiculo: countBy(filtered, (v) => v.tiposVehiculo),
      usuario: countBy(personas, (p) => p.tipoUsuario),
      condicion: countBy(personas, (p) => p.condicion),
      edad: countBy(personas, (p) => ageGroup(p.edad)),
      personas: personas.length,
      comparison: provinces.map((p) => {
        const sub = filtered.filter((v) => v.provincia === p);
        const t = computeTotals(sub);
        const valid = sub.filter((v) => v.coordStatus === 'valida');
        return { provincia: p, siniestros: t.siniestros, fallecidos: t.fallecidos, enConcentracion: valid.length ? valid.filter((v) => v.zoneId).length / valid.length : null };
      }).sort((a, b) => b.siniestros - a.siniestros),
      vias: countBy(filtered, (v) => v.via)
    };
  }, [filtered]);

  const zones = useMemo(() => {
    const ids = new Set(filtered.map((v) => v.zoneId).filter(Boolean));
    return (state.analysis?.zones ?? []).filter((z) => ids.has(z.id));
  }, [filtered, state.analysis]);
  const snap = state.analysis;

  if (!views.length) {
    return <main className="mx-auto w-full max-w-3xl px-4 py-12"><EmptyState title="Sin datos para analizar patrones" description="Importe la base de siniestros para generar distribuciones territoriales, temporales y por usuario vial." actionLabel="Ir a Gestión de datos" actionTo="/datos" /></main>;
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
      <PageHeader title="Análisis de patrones" description="Distribuciones espaciales, temporales, territoriales y por usuario vial. Seleccione una barra para filtrar; todos los paneles, el mapa y los indicadores se actualizan juntos." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Filtros">
          <Panel title="Filtros"><FilterPanel compact /></Panel>
        </aside>
        <div className="grid gap-6">
          <Panel title="Concentraciones espaciales" subtitle={snap ? `DBSCAN · ε = ${snap.params.epsMeters} m · mínimo ${snap.params.minPts} siniestros · distancia haversine (WGS84)` : 'Análisis no ejecutado'}>
            {snap ?
            <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
                <dl className="grid grid-cols-2 gap-4 xl:grid-cols-1">
                  <div><dt className="text-xs text-muted">Concentraciones en el conjunto</dt><dd className="text-2xl font-semibold tabular-nums">{formatInt(zones.length)}</dd></div>
                  <div><dt className="text-xs text-muted">Siniestros en concentraciones</dt><dd className="text-2xl font-semibold tabular-nums">{formatInt(filtered.filter((v) => v.zoneId).length)}</dd></div>
                  <div><dt className="text-xs text-muted">Siniestros aislados (ruido DBSCAN)</dt><dd className="text-lg font-semibold tabular-nums">{formatInt(filtered.filter((v) => !v.zoneId && v.coordStatus === 'valida').length)}</dd></div>
                  <div><dt className="text-xs text-muted">Excluidos por coordenadas</dt><dd className="text-lg font-semibold tabular-nums">{formatInt(filtered.filter((v) => v.coordStatus !== 'valida').length)}</dd></div>
                  <p className="col-span-2 text-[11px] text-muted xl:col-span-1">Las concentraciones son agrupaciones de puntos. No equivalen a tramos de la red vial porque no hay una red verificada cargada.</p>
                </dl>
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-ink">Persistencia entre años (15 primeras por IPIV)</h3>
                  <PersistenceMatrix zones={zones.slice(0, 15)} years={snap.yearsAnalyzed} views={views} />
                </div>
              </div> :
            <p className="text-sm text-muted">Ejecute el reprocesamiento desde la barra superior o Gestión de datos.</p>}
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Por provincia" subtitle="Siniestros fatales"><BarList data={d.provincia} unit="siniestros" onSelect={(l) => toggle('provincia', l)} activeLabel={filters.provincia} /></Panel>
            <Panel title="Por distrito" subtitle="Siniestros fatales"><BarList data={d.distrito} unit="siniestros" onSelect={(l) => toggle('distrito', l)} activeLabel={filters.distrito} /></Panel>
            <Panel title="Tipo de siniestro" subtitle="Clase registrada"><BarList data={d.clase} unit="siniestros" color="bg-navy" onSelect={(l) => toggle('clase', l)} activeLabel={filters.clase} /></Panel>
            <Panel title="Causa registrada" subtitle="Según la fuente; no equivale a causa verificada"><BarList data={d.causa} unit="siniestros" color="bg-navy" onSelect={(l) => toggle('causa', l)} activeLabel={filters.causa} /></Panel>
            <Panel title="Distribución horaria"><HourChart views={filtered} /></Panel>
            <Panel title="Día de la semana" subtitle="Siniestros fatales"><BarList data={weekdays.map((w) => d.dia.find((x) => x.label === w) ?? { label: w, value: 0 }).filter((x) => d.dia.length > 0)} unit="siniestros" max={7} /></Panel>
            <Panel title="Participación por tipo de vehículo" subtitle="Siniestros con al menos un vehículo del tipo (un siniestro puede contar en varios tipos)"><BarList data={d.vehiculo} unit="siniestros" color="bg-warn" onSelect={(l) => toggle('tipoVehiculo', l)} activeLabel={filters.tipoVehiculo} /></Panel>
            <Panel title="Perfil de usuarios viales" subtitle={`Personas vinculadas: ${formatInt(d.personas)}`}>
              <BarList data={d.usuario} unit="personas" color="bg-warn" onSelect={(l) => toggle('tipoUsuario', l)} activeLabel={filters.tipoUsuario} />
              {d.edad.length > 0 && <div className="mt-5 border-t border-line pt-4"><h3 className="mb-2 text-xs font-semibold">Grupo de edad</h3><BarList data={d.edad} unit="personas" /></div>}
              {d.condicion.length > 0 && <div className="mt-5 border-t border-line pt-4"><h3 className="mb-2 text-xs font-semibold">Condición</h3><BarList data={d.condicion} unit="personas" color="bg-fatal" /></div>}
            </Panel>
          </div>

          <Panel title="Comparación entre provincias" subtitle="Conjunto filtrado">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="border-b border-line text-left text-xs text-muted"><th scope="col" className="py-2 font-medium">Provincia</th><th scope="col" className="py-2 text-right font-medium">Siniestros</th><th scope="col" className="py-2 text-right font-medium">Fallecidos</th><th scope="col" className="py-2 text-right font-medium">% en concentraciones</th></tr></thead>
                <tbody>
                  {d.comparison.map((r) =>
                  <tr key={r.provincia} className="border-b border-line/70">
                      <td className="py-2">{titleCase(r.provincia)}</td>
                      <td className="py-2 text-right tabular-nums">{formatInt(r.siniestros)}</td>
                      <td className="py-2 text-right tabular-nums">{formatInt(r.fallecidos)}</td>
                      <td className="py-2 text-right tabular-nums">{snap ? formatPct(r.enConcentracion, 0) : 'Sin análisis'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          {d.vias.length > 0 &&
          <Panel title="Corredores viales registrados" subtitle="Código de vía según la fuente, sin verificar contra red oficial">
              <BarList data={d.vias} unit="siniestros" onSelect={(l) => toggle('via', l)} activeLabel={filters.via} />
            </Panel>
          }
        </div>
      </div>
    </main>);

}