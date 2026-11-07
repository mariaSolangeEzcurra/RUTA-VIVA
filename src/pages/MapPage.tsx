import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertOctagonIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useZoneTools } from '../hooks/useZoneTools';
import { AccidentMap } from '../components/map/AccidentMap';
import type { ColorBy, MapMode } from '../components/map/AccidentMap';
import { MapToolbar } from '../components/map/MapToolbar';
import { MapTimeline } from '../components/map/MapTimeline';
import { MapLegend } from '../components/map/MapLegend';
import { MapZonesPanel } from '../components/map/MapZonesPanel';
import { SiniestroDetail } from '../components/map/SiniestroDetail';
import { FilterPanel } from '../components/filters/FilterPanel';
import { EmptyState } from '../components/ui/EmptyState';
import { applyFilters, activeFilterCount, withoutPeriod } from '../utils/filters';
import { datasetCoverage } from '../utils/temporal';
import { quarterSeries } from '../utils/quarters';
import type { Quarter } from '../utils/quarters';

const ease = [0.23, 1, 0.32, 1] as const;
const width = () => typeof window === 'undefined' ? 1440 : window.innerWidth;

export function MapPage() {
  const { filtered, filters, setFilters, state, views, ready } = useData();
  const { getZone, downloadFicha } = useZoneTools();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(() => width() >= 1536);
  const [zonesOpen, setZonesOpen] = useState(() => width() >= 1024);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [mode, setMode] = useState<MapMode>('zonas');
  const [colorBy, setColorBy] = useState<ColorBy>('prioridad');
  const [focus, setFocus] = useState<{lat: number;lon: number;zoom: number;key: number;} | null>(null);
  const coverage = useMemo(() => datasetCoverage(views), [views]);
  const periodBase = useMemo(() => applyFilters(views, withoutPeriod(filters)), [views, filters]);
  const series = useMemo(() => quarterSeries(periodBase, coverage), [periodBase, coverage]);
  const isMobile = width() < 640;

  const points = useMemo(() => filtered.filter((v) => v.coordStatus === 'valida' && v.lat !== null && v.lon !== null), [filtered]);
  const zones = useMemo(() => {
    const ids = new Set(filtered.map((v) => v.zoneId).filter(Boolean));
    return (state.analysis?.zones ?? []).filter((z) => ids.has(z.id));
  }, [filtered, state.analysis]);
  const priorityCount = zones.filter((z) => z.category === 'muy_alta' || z.category === 'alta').length;
  const territorial = filters.provincia || filters.distrito || filters.via;
  const focusZone = getZone(searchParams.get('zona'));
  const fitKey = `${filters.provincia}|${filters.distrito}|${filters.via}|${focusZone?.id ?? ''}`;
  const fitPoints = focusZone ?
  views.filter((v) => focusZone.memberCodes.includes(v.codigo) && v.lat !== null && v.lon !== null).map((p) => ({ lat: p.lat as number, lon: p.lon as number })) :
  territorial ? points.map((p) => ({ lat: p.lat as number, lon: p.lon as number })) : null;
  const item = selected ? views.find((v) => v.codigo === selected) ?? null : null;
  const zone = getZone(item?.zoneId);
  const hidden = filtered.length - points.length;
  const nFilters = activeFilterCount(filters);

  const selectZone = (id: string | null) => {
    setActiveZoneId(id);
    if (id && width() < 1024) setZonesOpen(false);
  };

  if (ready && views.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <EmptyState title="El mapa no tiene siniestros que mostrar" description="Importe el archivo de siniestros fatales desde Gestión de datos; quedará guardado y no tendrá que volver a cargarlo." actionLabel="Ir a Gestión de datos" actionTo="/datos" />
      </main>);
  }

  return (
    <main className="relative flex h-[calc(100vh-59px)] min-h-[560px] w-full overflow-hidden lg:h-[calc(100vh-99px)]">
      <h1 className="sr-only">Mapa de siniestralidad – Región Arequipa</h1>
      <AnimatePresence initial={false}>
        {filtersOpen &&
        <motion.aside key="filters" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease }}
        className="scrollbar-thin absolute inset-y-0 left-0 z-[1001] w-[88vw] max-w-[310px] shrink-0 overflow-y-auto border-r border-line bg-surface p-4 shadow-2xl lg:static lg:w-72 lg:shadow-none" aria-label="Filtros">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-bold"><SlidersHorizontalIcon className="h-4 w-4 text-primary" />Filtros</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-lg p-1 text-muted hover:bg-canvas" aria-label="Ocultar filtros"><PanelLeftCloseIcon className="h-4 w-4" /></button>
            </div>
            <FilterPanel compact />
            {hidden > 0 && <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-[11px] text-muted">{hidden} siniestros del conjunto filtrado no se muestran por coordenadas faltantes o inválidas.</p>}
          </motion.aside>
        }
      </AnimatePresence>

      <div className="relative min-w-0 flex-1">
        <AccidentMap points={points} zones={zones} selectedCode={selected} onSelect={setSelected} focus={focus} fitPoints={fitPoints} fitKey={fitKey}
        mode={mode} colorBy={colorBy} activeZoneId={activeZoneId} onZoneSelect={selectZone} />
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[900] flex flex-col items-start gap-2 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            {!filtersOpen &&
            <button type="button" onClick={() => setFiltersOpen(true)} className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-xs font-bold text-ink shadow-lg" aria-label="Mostrar filtros">
                <PanelLeftOpenIcon className="h-4 w-4 text-primary" /> Filtros
                {nFilters > 0 && <span className="rounded-full bg-primary px-1.5 py-px text-[10px] text-white">{nFilters}</span>}
              </button>
            }
            {!zonesOpen &&
            <button type="button" onClick={() => setZonesOpen(true)} className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-xl bg-[#E11D48] px-3.5 text-xs font-bold text-white shadow-lg" aria-label="Mostrar zonas prioritarias">
                <AlertOctagonIcon className="h-4 w-4" /> {priorityCount} zonas prioritarias
              </button>
            }
          </div>
          <MapToolbar mode={mode} onMode={setMode} colorBy={colorBy} onColorBy={setColorBy}
          trimestre={filters.trimestre as Quarter | null} onTrimestre={(q) => setFilters({ ...filters, trimestre: q })} />
          <MapLegend mode={mode} colorBy={colorBy} defaultOpen={!isMobile} />
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[900]">
          <MapTimeline series={series} yearFrom={filters.yearFrom} yearTo={filters.yearTo} trimestre={filters.trimestre as Quarter | null}
          onSelect={(y, q) => setFilters({ ...filters, yearFrom: y, yearTo: y, trimestre: q })}
          onReset={() => setFilters(withoutPeriod(filters))} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {zonesOpen &&
        <motion.aside key="zones" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2, ease }}
        className="absolute inset-y-0 right-0 z-[1001] w-[92vw] max-w-[340px] shrink-0 border-l border-line shadow-2xl lg:static lg:w-80 lg:shadow-none" aria-label="Zonas prioritarias">
            <MapZonesPanel zones={zones} activeZoneId={activeZoneId} onSelect={selectZone} onClose={() => setZonesOpen(false)} hasAnalysis={!!state.analysis} />
          </motion.aside>
        }
      </AnimatePresence>

      <AnimatePresence>
        {item &&
        <motion.div key={item.codigo} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22, ease }}
        className="absolute inset-y-0 right-0 z-[1002] w-full max-w-sm border-l border-line shadow-2xl">
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
