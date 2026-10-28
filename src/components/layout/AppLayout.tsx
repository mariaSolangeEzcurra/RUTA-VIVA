import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AnalysisStatusBanner } from './AnalysisStatusBanner';
import { useData } from '../../contexts/DataContext';

export function AppLayout() {
  const { loadError } = useData();
  return (
    <div className="flex min-h-full w-full flex-col bg-canvas">
      <AppHeader />
      <AnalysisStatusBanner />
      {loadError &&
      <div role="alert" className="bg-fatal/10 px-4 py-2 text-sm text-fatal">
          No se pudo abrir la base local del navegador: {loadError}
        </div>
      }
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>);

}