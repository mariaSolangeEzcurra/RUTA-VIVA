import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3Icon, BookOpenIcon, ClipboardCheckIcon, FileTextIcon, HardHatIcon, HomeIcon, ListOrderedIcon, MapIcon, MenuIcon, RouteIcon, UploadIcon, XIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../utils/text';

const nav = [
{ to: '/', label: 'Inicio', end: true, icon: HomeIcon },
{ to: '/mapa', label: 'Mapa', icon: MapIcon },
{ to: '/patrones', label: 'Patrones', icon: BarChart3Icon },
{ to: '/ranking', label: 'Ranking IPIV', icon: ListOrderedIcon },
{ to: '/intervenciones', label: 'Intervenciones', icon: HardHatIcon },
{ to: '/seguimiento', label: 'Seguimiento', icon: ClipboardCheckIcon },
{ to: '/fichas', label: 'Fichas técnicas', icon: FileTextIcon },
{ to: '/metodologia', label: 'Metodología', icon: BookOpenIcon }];


export function AppHeader() {
  const { state, ready, stale } = useData();
  const [open, setOpen] = useState(false);
  const hasData = state.dataVersion > 0;

  const status = !ready ? 'Cargando base local…' : hasData ? `Datos v${state.dataVersion} · ${formatDateTime(state.lastProcessedAt)}` : 'Sin datos importados';

  return (
    <header className="sticky top-0 z-[1100] bg-navy text-white shadow-[0_6px_20px_-12px_rgba(0,0,0,0.6)]">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 lg:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary ring-2 ring-white/90 ring-offset-2 ring-offset-navy transition-transform duration-150 group-hover:-rotate-3" aria-hidden>
            <RouteIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-extrabold tracking-tight">RUTA-VIVA <span className="font-semibold text-signal">Perú</span></span>
            <span className="hidden truncate text-[11px] text-white/60 sm:block">Dónde y cuándo ocurren los siniestros fatales, y qué zonas atender primero</span>
          </span>
        </Link>
        <span className="hidden whitespace-nowrap rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/85 md:inline">Región Arequipa</span>
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <span className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/5 px-3 py-1 text-xs text-white/75">
            <span className={`h-2 w-2 rounded-full ${!hasData ? 'bg-white/40' : stale ? 'bg-signal' : 'bg-emerald-400'}`} aria-hidden />
            {status}
            {hasData && stale && <span className="text-signal">· análisis pendiente</span>}
          </span>
          <NavLink to="/datos" className={({ isActive }) => `inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-xs font-bold transition-colors duration-150 ease-out ${isActive ? 'bg-signal text-navy' : 'bg-white/10 hover:bg-white/20'}`}>
            <UploadIcon className="h-3.5 w-3.5" /> Gestión de datos
          </NavLink>
        </div>
        <button type="button" className="ml-auto rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>
      <nav aria-label="Secciones" className="hidden bg-navy-2 lg:block">
        <ul className="mx-auto flex max-w-[1600px] items-center gap-0.5 px-4 lg:px-6">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `relative inline-flex h-10 items-center gap-1.5 whitespace-nowrap px-3 text-[13px] transition-colors duration-150 ease-out ${isActive ? 'font-bold text-white after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-signal' : 'text-white/65 hover:text-white'}`}>
                  {({ isActive }) => <><Icon className={`h-4 w-4 ${isActive ? 'text-signal' : ''}`} />{n.label}</>}
                </NavLink>
              </li>);
          })}
        </ul>
      </nav>
      <div className="lane-line h-[3px] bg-navy-2 opacity-90" aria-hidden />
      <AnimatePresence>
        {open &&
        <motion.nav initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }} className="border-t border-white/10 bg-navy-2 px-4 py-3 lg:hidden" aria-label="Secciones">
            <p className="mb-2 flex items-center gap-2 text-xs text-white/70"><span className={`h-2 w-2 rounded-full ${!hasData ? 'bg-white/40' : stale ? 'bg-signal' : 'bg-emerald-400'}`} />{status}</p>
            <ul className="grid grid-cols-2 gap-1">
              {[...nav, { to: '/datos', label: 'Gestión de datos', end: false, icon: UploadIcon }].map((n) => {
                const Icon = n.icon;
                return (
                  <li key={n.to}>
                    <NavLink to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-white/15 font-bold text-white' : 'text-white/80'}`}>
                      <Icon className="h-4 w-4 text-signal" />{n.label}
                    </NavLink>
                  </li>);
              })}
            </ul>
          </motion.nav>
        }
      </AnimatePresence>
    </header>);

}
