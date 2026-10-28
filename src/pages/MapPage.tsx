import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelLeftCloseIcon, PanelLeftOpenIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useZoneTools } from '../hooks/useZoneTools';
import { AccidentMap } from '../components/map/AccidentMap';
import { MapLegend } from '../components/map/MapLegend';
import { SiniestroDetail } from '../components/map/SiniestroDetail';
import { FilterPanel } from '../components/filters/FilterPanel';
import { KpiStrip } from '../components/KpiStrip';
import { EmptyState } from '../components/ui/EmptyState';

const ease = [0.23, 1, 0.32, 1] as const;

export function MapPage() {
  const { filtered, filters, state, views, ready } = useData();
  const { getZone, downloadFicha } = useZoneTools();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [focus, setFocus] = useState<{lat: number;lon: number;zoom: number;key: number;} | null>(null);

  const points = useMemo(() => filtered.filter((v) => v.coordStatus === 'valida' && v.lat !== null && v.lon !== null), [filtered]);
  const zones = useMemo(() => {
    const ids = new Set(filtered.map((v) => v.zoneId).filter(Boolean));
    return (state.analysis?.zones ?? []).filter((z) => ids.has(z.id));
  }, [filtered, state.analysis]);
  const territorial = filters.provincia || filters.distrito || filters.via;
  const focusZone = getZone(searchParams.get('zona'));
  const fitKey = `${filters.provincia}|${filters.distrito}|${filters.via}|${focusZone?.id ?? ''}`;
  const fitPoints = focusZone ?
  views.filter((v) => focusZone.memberCodes.includes(v.codigo) && v.lat !== null && v.lon !== null).map((p) => ({ lat: p.lat as number, lon: p.lon as number })) :
  territorial ? points.map((p) => ({ lat: p.lat as number, lon: p.lon as number })) : null;
  const item = selected ? views.find((v) => v.codigo === selected) ?? null : null;
  const zone = getZone(item?.zoneId);
  const hidden = filtered.length - points.length;

  if (ready && views.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <EmptyState title="El mapa no tiene siniestros que mostrar" description="Los archivos originales del ONSV no están disponibles en este entorno. Importe el archivo de siniestros fatales desde Gestión de datos; quedará guardado y no tendrá que volver a cargarlo." actionLabel="Ir a Gestión de datos" actionTo="/datos" />
      </main>);

  }

  return (
    <main className="relative flex h-[calc(100vh-56px)] min-h-[560px] w-full lg:h-[calc(100vh-96px)]">
      <h1 className="sr-only">Mapa de siniestralidad – Región Arequipa</h1>
      <AnimatePresence initial={false}>
        {filtersOpen &&
        <motion.aside
          key="filters"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2, ease }}
          className="absolute inset-y-0 left-0 z-[1000] w-72 overflow-y-auto border-r border-line bg-surface p-4 shadow-lg lg:static lg:shadow-none"
          aria-label="Filtros">
          
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontalIcon className="h-4 w-4 text-muted" />Filtros</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="rounded p-1 text-muted hover:bg-canvas" aria-label="Ocultar filtros"><PanelLeftCloseIcon className="h-4 w-4" /></button>
            </div>
            <FilterPanel compact />
            {hidden > 0 && <p className="mt-4 rounded bg-canvas px-3 py-2 text-[11px] text-muted">{hidden} siniestros del conjunto filtrado no se muestran por coordenadas faltantes o inválidas.</p>}
          </motion.aside>
        }
      </AnimatePresence>

      <div className="relative flex-1">
        <AccidentMap points={points} zones={zones} selectedCode={selected} onSelect={setSelected} focus={focus} fitPoints={fitPoints} fitKey={fitKey} />
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[900] flex items-start gap-2 pr-12">
          {!filtersOpen &&
          <button type="button" onClick={() => setFiltersOpen(true)} className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-xs font-medium shadow-sm" aria-label="Mostrar filtros">
              <PanelLeftOpenIcon className="h-4 w-4" /> Filtros
            </button>
          }
          <div className="pointer-events-auto hidden min-w-0 flex-1 xl:block"><KpiStrip variant="overlay" /></div>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-3 z-[900] hidden sm:block"><MapLegend /></div>
      </div>

      <AnimatePresence>
        {item &&
        <motion.div
          key={item.codigo}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.22, ease }}
          className="absolute inset-y-0 right-0 z-[1000] w-full max-w-sm border-l border-line shadow-xl">
          
            <SiniestroDetail
            item={item}
            zone={zone}
            dataVersion={state.dataVersion}
            processedAt={state.lastProcessedAt}
            onClose={() => setSelected(null)}
            onCenter={() => item.lat !== null && item.lon !== null && setFocus({ lat: item.lat, lon: item.lon, zoom: 16, key: Date.now() })}
            onFicha={zone ? () => downloadFicha(zone) : null} />
          
          </motion.div>
        }
      </AnimatePresence>
    </main>);

}