import React, { useState } from 'react';
import { CheckCircle2Icon, Loader2Icon, PlayIcon, XCircleIcon } from 'lucide-react';
import { runSelfTests } from '../../utils/selfTests';
import type { TestResult } from '../../utils/selfTests';
import { Button } from '../ui/Button';

export function SelfTestPanel() {
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 20));
    setResults(await runSelfTests());
    setRunning(false);
  };
  const passed = results?.filter((r) => r.passed).length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void run()} disabled={running}>{running ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}Ejecutar pruebas</Button>
        <span className="text-xs text-muted">Se ejecutan en este navegador con datos sintéticos de prueba, aislados de la base real (que no se modifica).</span>
      </div>
      {results &&
      <div className="mt-4">
          <p className={`text-sm font-semibold ${passed === results.length ? 'text-ok' : 'text-fatal'}`}>{passed} de {results.length} pruebas superadas</p>
          <ul className="mt-3 divide-y divide-line rounded-md border border-line">
            {results.map((r) =>
          <li key={r.name} className="flex items-start gap-3 px-3 py-2 text-xs">
                {r.passed ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-fatal" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{r.name}</p>
                  <p className="text-muted">{r.group}{!r.passed && ` · ${r.message}`}</p>
                </div>
                <span className="shrink-0 tabular-nums text-muted">{r.ms.toFixed(0)} ms</span>
              </li>
          )}
          </ul>
        </div>
      }
    </div>);

}