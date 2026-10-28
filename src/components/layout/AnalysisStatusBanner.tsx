import React from 'react';
import { AlertTriangleIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';

export function AnalysisStatusBanner() {
  const { stale, staleReason, reprocess, processing } = useData();
  if (!stale) return null;
  return (
    <div role="status" className="border-b border-warn/25 bg-amber-50">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-2 text-sm text-[#7a3d06] sm:flex-row sm:items-center lg:px-6">
        <AlertTriangleIcon className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
        <p className="flex-1">
          <span className="font-semibold">Análisis pendiente de actualización.</span> {staleReason} Los indicadores básicos ya reflejan los datos actuales; las concentraciones y el ranking IPIV no.
        </p>
        <Button size="sm" variant="secondary" onClick={() => void reprocess()} disabled={processing}>
          {processing ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <RefreshCwIcon className="h-3.5 w-3.5" />}
          {processing ? 'Procesando…' : 'Ejecutar reprocesamiento'}
        </Button>
      </div>
    </div>);

}