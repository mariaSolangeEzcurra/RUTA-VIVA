import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MenuIcon, UploadIcon, XIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../utils/text';

const nav = [
{ to: '/', label: 'Inicio', end: true },
{ to: '/mapa', label: 'Mapa' },
{ to: '/patrones', label: 'Patrones' },
{ to: '/ranking', label: 'Ranking IPIV' },
{ to: '/intervenciones', label: 'Intervenciones' },
{ to: '/seguimiento', label: 'Seguimiento' },
{ to: '/fichas', label: 'Fichas técnicas' },
{ to: '/metodologia', label: 'Fuentes y metodología' }];


export function AppHeader() {
  const { state, ready, stale } = useData();
  const [open, setOpen] = useState(false);
  const hasData = state.dataVersion > 0;

  const status = !ready ? 'Cargando base local…' : hasData ? `Datos v${state.dataVersion} · ${formatDateTime(state.lastProcessedAt)}` : 'Sin datos importados';

  return (
    <header className="sticky top-0 z-[1100] bg-navy text-white">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 lg:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white/10 font-mono text-xs font-medium" aria-hidden>RV</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-wide">RUTA-VIVA PERÚ</span>
            <span className="hidden truncate text-[11px] text-white/65 sm:block">Analítica geoespacial explicable de siniestralidad vial · Prototipo de investigación</span>
          </span>
        </Link>
        <span className="hidden whitespace-nowrap rounded border border-white/20 px-2 py-0.5 text-[11px] text-white/80 md:inline">Piloto: Región Arequipa</span>
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <span className="flex items-center gap-2 whitespace-nowrap text-xs text-white/75">
            <span className={`h-2 w-2 rounded-full ${!hasData ? 'bg-white/40' : stale ? 'bg-amber-400' : 'bg-emerald-400'}`} aria-hidden />
            {status}
            {hasData && stale && <span className="text-amber-300">· análisis pendiente</span>}
          </span>
          <NavLink to="/datos" className={({ isActive }) => `inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors duration-150 ease-out ${isActive ? 'bg-white text-navy' : 'bg-white/10 hover:bg-white/20'}`}>
            <UploadIcon className="h-3.5 w-3.5" /> Gestión de datos
          </NavLink>
        </div>
        <button type="button" className="ml-auto rounded p-2 hover:bg-white/10 lg:hidden" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>
      <nav aria-label="Secciones" className="hidden border-t border-white/10 bg-navy-2 lg:block">
        <ul className="mx-auto flex max-w-[1600px] items-center gap-1 px-4 lg:px-6">
          {nav.map((n) =>
          <li key={n.to}>
              <NavLink to={n.to} end={n.end} className={({ isActive }) => `relative inline-flex h-10 items-center whitespace-nowrap px-3 text-[13px] transition-colors duration-150 ease-out ${isActive ? 'font-semibold text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-white' : 'text-white/70 hover:text-white'}`}>
                {n.label}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
      <AnimatePresence>
        {open &&
        <motion.nav initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }} className="border-t border-white/10 bg-navy-2 px-4 py-3 lg:hidden" aria-label="Secciones">
            <p className="mb-2 text-xs text-white/70">{status}</p>
            <ul className="grid gap-1">
              {[...nav, { to: '/datos', label: 'Gestión de datos', end: false }].map((n) =>
            <li key={n.to}>
                  <NavLink to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => `block rounded px-3 py-2 text-sm ${isActive ? 'bg-white/15 font-semibold' : 'text-white/80'}`}>
                    {n.label}
                  </NavLink>
                </li>
            )}
            </ul>
          </motion.nav>
        }
      </AnimatePresence>
    </header>);

}