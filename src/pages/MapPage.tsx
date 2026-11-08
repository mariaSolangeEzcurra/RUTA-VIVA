import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertOctagonIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PanelRightCloseIcon, SlidersHorizontalIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useZoneTools } from '../hooks/useZoneTools';
import { AccidentMap } from '../components/map/AccidentMap';
import type { ColorBy, MapMode } from '../components/map/AccidentMap';
import { BasemapPicker, MapToolbar } from '../components/map/MapToolbar';
import { MapTimeline } from '../components/map/MapTimeline';
import { MapLegend } from '../components/map/MapLegend';
import { MapZonesPanel } from '../components/map/MapZonesPanel';
import { SiniestroDetail } from '../components/map/SiniestroDetail';
import { FilterPanel } from '../components/filters/FilterPanel';
import { EmptyState } from '../components/ui/EmptyState';
import { BASEMAPS, DEFAULT_BASEMAP, FALLBACK_ORDER } from '../components/map/basemaps';
import { applyFilters, activeFilterCount, withoutPeriod } from '../utils/filters';
import { datasetCoverage } from '../utils/temporal';
import { quarterSeries } from '../utils/quarters';
import type { Quarter } from '../utils/quarters';

const ease = [0.23, 1, 0.32, 1] as const;
const width = () => typeof window === 'undefined' ? 1440 : window.innerWidth;
const isDesktop = () => width() >= 1024;

export function MapPage() {
  const { filtered, filters, setFilters, state, views, ready } = useData();
  const { getZone, downloadFicha } = useZoneTools();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(() => width() >= 1536);
  const [panelOpen, setPanelOpen] = useState(() => isDesktop());
  const [panelTab, setPanelTab] = useState<'zonas' | 'leyenda'>('zonas');
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [mode, setMode] = useState<MapMode>('zonas');
  const [colorBy, setColorBy] = useState<ColorBy>('prioridad');
  const [showMinor, setShowMinor] = useState(true);
  const [focus, setFocus] = useState<{lat: number;lon: number;zoom: number;key: number;} | null>(null);
  const [basemap, setBasemap] = useState<string>(() => {
    try {return localStorage.getItem('rv-basemap') ?? DEFAULT_BASEMAP;} catch {return DEFAULT_BASEMAP;}
  });
  const tried = useRef(new Set<string>());
  const changeBasemap = (id: string, persist = true) => {
    setBasemap(id);
    if (persist) try {localStorage.setItem('rv-basemap', id);} catch {/* sin almacenamiento */}
  };
  const onBasemapFail = (failed: string) => {
    tried.current.add(failed);
    const next = FALLBACK_ORDER.find((id) => !tried.current.has(id));
    if (!next) {
      toast.error('No se pudo cargar ningún mapa base. Revise su conexión a internet; las zonas y puntos siguen visibles.');
      return;
    }
    changeBasemap(next, false);
    toast.info(`El mapa base «${BASEMAPS.find((b) => b.id === failed)?.label}» no respondió; se cambió a «${BASEMAPS.find((b) => b.id === next)?.label}».`);
  };

  const coverage = useMemo(() => datasetCoverage(views), [views]);
  const periodBase = useMemo(() => applyFilters(views, withoutPeriod(filters)), [views, filters]);
  const series = useMemo(() => quarterSeries(periodBase, coverage), [periodBase, coverage]);
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
    if (id && !isDesktop()) setPanelOpen(false);
  };
  const openPanel = (tab: 'zonas' | 'leyenda') => {
    if (panelOpen && panelTab === tab) {setPanelOpen(false);return;}
    setPanelTab(tab);
    setPanelOpen(true);
  };

  if (ready && views.length === 0) {
    return (
      <main className="page"><div className="mx-auto max-w-3xl py-6">
        <EmptyState title="El mapa no tiene siniestros que mostrar" description="Importe el archivo de siniestros fatales desde Gestión de datos; quedará guardado y no tendrá que volver a cargarlo." actionLabel="Ir a Gestión de datos" actionTo="/datos" />
      </div></main>);
  }

  const chipBtn = 'inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-colors';

  return (
    <main className="page-x flex h-[calc(100dvh-59px)] min-h-[520px] flex-col gap-3 py-3 lg:h-[calc(100dvh-99px)] lg:py-4">
      <h1 className="sr-only">Mapa de siniestralidad – Región Arequipa</h1>

      <MapToolbar mode={mode} onMode={setMode} colorBy={colorBy} onColorBy={setColorBy}
      trimestre={filters.trimestre as Quarter | null} onTrimestre={(q) => setFilters({ ...filters, trimestre: q })}
      leading={
      <button type="button" onClick={() => setFiltersOpen((o) => !o)} aria-pressed={filtersOpen}
      className={`${chipBtn} ${filtersOpen ? 'bg-primary text-white' : 'border border-line bg-surface text-ink hover:bg-canvas'}`}>
            {filtersOpen ? <PanelLeftCloseIcon className="h-4 w-4" /> : <PanelLeftOpenIcon className="h-4 w-4 text-primary" />} Filtros
            {nFilters > 0 && <span className={`rounded-full px-1.5 py-px text-[10px] ${filtersOpen ? 'bg-white/25' : 'bg-primary text-white'}`}>{nFilters}</span>}
          </button>
      }
      trailing={
      <>
            <button type="button" onClick={() => openPanel('leyenda')} aria-pressed={panelOpen && panelTab === 'leyenda'}
        className={`${chipBtn} hidden sm:inline-flex ${panelOpen && panelTab === 'leyenda' ? 'bg-navy text-white' : 'border border-line bg-surface text-ink hover:bg-canvas'}`}>
              Leyenda y mapa base
            </button>
            <button type="button" onClick={() => openPanel('zonas')} aria-pressed={panelOpen && panelTab === 'zonas'}
        className={`${chipBtn} ${panelOpen && panelTab === 'zonas' ? 'bg-[#BE123C] text-white' : 'bg-[#E11D48] text-white hover:bg-[#BE123C]'}`}>
              {panelOpen && panelTab === 'zonas' ? <PanelRightCloseIcon className="h-4 w-4" /> : <AlertOctagonIcon className="h-4 w-4" />}
              {priorityCount}<span className="hidden sm:inline"> prioritarias</span>
            </button>
          </>
      } />

      <div className="relative flex min-h-0 flex-1 gap-3 lg:gap-4">
        <AnimatePresence initial={false}>
          {filtersOpen &&
          <>
              <motion.div key="fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1150] bg-navy/40 lg:hidden" onClick={() => setFiltersOpen(false)} />
              <motion.aside key="filters" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease }}
            className="scrollbar-thin fixed inset-y-0 left-0 z-[1200] w-[88vw] max-w-[320px] overflow-y-auto bg-surface p-4 shadow-2xl lg:static lg:z-auto lg:w-72 lg:shrink-0 lg:rounded-2xl lg:border lg:border-line/80 lg:shadow-none" aria-label="Filtros">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-[15px] font-bold"><SlidersHorizontalIcon className="h-4 w-4 text-primary" />Filtros</h2>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-lg p-1 text-muted hover:bg-canvas" aria-label="Ocultar filtros"><PanelLeftCloseIcon className="h-4 w-4" /></button>
                </div>
                <FilterPanel compact />
                {hidden > 0 && <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-[11px] text-muted">{hidden} siniestros del conjunto filtrado no se muestran por coordenadas faltantes o inválidas.</p>}
              </motion.aside>
            </>
          }
        </AnimatePresence>

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-line/80 bg-[#dfe4e8]">
          <AccidentMap points={points} zones={zones} selectedCode={selected} onSelect={setSelected} focus={focus} fitPoints={fitPoints} fitKey={fitKey}
          mode={mode} colorBy={colorBy} activeZoneId={activeZoneId} onZoneSelect={selectZone}
          basemap={basemap} onBasemapFail={onBasemapFail} showMinorZones={showMinor} />
          <AnimatePresence>
            {item &&
            <motion.div key={item.codigo} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22, ease }}
            className="absolute inset-y-0 right-0 z-[1000] w-full max-w-sm border-l border-line shadow-2xl">
                <SiniestroDetail item={item} zone={zone} dataVersion={state.dataVersion} processedAt={state.lastProcessedAt}
              onClose={() => setSelected(null)}
              onCenter={() => item.lat !== null && item.lon !== null && setFocus({ lat: item.lat, lon: item.lon, zoom: 16, key: Date.now() })}
              onFicha={zone ? () => downloadFicha(zone) : null} />
              </motion.div>
            }
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {panelOpen &&
          <>
              <motion.div key="pb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1150] bg-navy/40 lg:hidden" onClick={() => setPanelOpen(false)} />
              <motion.aside key="panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2, ease }}
            className="fixed inset-y-0 right-0 z-[1200] w-[92vw] max-w-[340px] overflow-hidden bg-surface shadow-2xl lg:static lg:z-auto lg:w-80 lg:shrink-0 lg:rounded-2xl lg:border lg:border-line/80 lg:shadow-none" aria-label="Zonas y leyenda">
                <MapZonesPanel zones={zones} activeZoneId={activeZoneId} onSelect={selectZone} onClose={() => setPanelOpen(false)} hasAnalysis={!!state.analysis}
              tab={panelTab} onTab={setPanelTab}
              legend={<div className="grid gap-5"><MapLegend bare mode={mode} colorBy={colorBy} showMinor={showMinor} onShowMinor={setShowMinor} /><div className="border-t border-line pt-4"><BasemapPicker value={basemap} onChange={(id) => {tried.current.clear();changeBasemap(id);}} /></div></div>} />
              </motion.aside>
            </>
          }
        </AnimatePresence>
      </div>

      <MapTimeline series={series} yearFrom={filters.yearFrom} yearTo={filters.yearTo} trimestre={filters.trimestre as Quarter | null}
      onSelect={(y, q) => setFilters({ ...filters, yearFrom: y, yearTo: y, trimestre: q })}
      onReset={() => setFilters(withoutPeriod(filters))} />
    </main>);

}
