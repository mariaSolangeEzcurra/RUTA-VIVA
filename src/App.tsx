import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DataProvider } from './contexts/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { Patterns } from './pages/Patterns';
import { Ranking } from './pages/Ranking';
import { ZoneDetail } from './pages/ZoneDetail';
import { Interventions } from './pages/Interventions';
import { Tracking } from './pages/Tracking';
import { TechnicalSheets } from './pages/TechnicalSheets';
import { Methodology } from './pages/Methodology';
import { DataManagement } from './pages/DataManagement';

export function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mapa" element={<MapPage />} />
            <Route path="/patrones" element={<Patterns />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/zona/:id" element={<ZoneDetail />} />
            <Route path="/intervenciones" element={<Interventions />} />
            <Route path="/seguimiento" element={<Tracking />} />
            <Route path="/fichas" element={<TechnicalSheets />} />
            <Route path="/metodologia" element={<Methodology />} />
            <Route path="/datos" element={<DataManagement />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors closeButton />
    </DataProvider>);

}