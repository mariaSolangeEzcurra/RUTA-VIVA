import React from 'react';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { OriginalSourcesStatus } from '../components/OriginalSourcesStatus';
import { TemporalValidationPanel } from '../components/methodology/TemporalValidationPanel';
import { SelfTestPanel } from '../components/methodology/SelfTestPanel';
import { complementarySources } from '../data/sources';
import type { ComplementaryStatus } from '../data/sources';
import { categoryThresholds, criteriaDefs } from '../data/ipivConfig';
import { AREQUIPA_BBOX } from '../utils/parsing';

const statusStyle: Record<ComplementaryStatus, string> = { disponible: 'text-ok', pendiente: 'text-warn', no_accesible: 'text-fatal' };
const statusText: Record<ComplementaryStatus, string> = { disponible: 'Disponible', pendiente: 'Pendiente', no_accesible: 'No accesible' };

const sections = [
['fuentes', 'Fuentes'], ['integridad', 'Integridad'], ['espacial', 'Análisis espacial'], ['ipiv', 'IPIV'],
['calidad', 'Calidad del dato'], ['validacion', 'Validación'], ['pruebas', 'Pruebas'], ['limitaciones', 'Limitaciones']];


export function Methodology() {
  const { state } = useData();
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6">
      <PageHeader title="Fuentes y metodología" description="Fuentes, reglas de integridad, fórmulas, parámetros, validación y limitaciones del prototipo. Todo lo que aparece aquí corresponde a lo implementado." />
      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Contenido" className="hidden lg:block">
          <ul className="sticky top-28 grid gap-1 text-sm">
            {sections.map(([id, l]) => <li key={id}><a href={`#${id}`} className="block rounded px-2 py-1 text-muted hover:bg-surface hover:text-ink">{l}</a></li>)}
          </ul>
        </nav>
        <div className="grid min-w-0 gap-6">
          <Panel title="Fuentes originales" className="scroll-mt-28"><div id="fuentes" /><OriginalSourcesStatus /></Panel>
          <Panel title="Fuentes complementarias" subtitle="Arquitectura preparada; no se asume ninguna como descargada">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead><tr className="border-b border-line text-left text-muted"><th scope="col" className="py-2 font-medium">Fuente</th><th scope="col" className="py-2 font-medium">Uso previsto</th><th scope="col" className="py-2 font-medium">Estado</th></tr></thead>
                <tbody>
                  {complementarySources.map((s) =>
                  <tr key={s.id} className="border-b border-line/70 align-top">
                      <td className="py-2 pr-3"><p className="font-medium text-ink">{s.name}</p><p className="text-muted">{s.owner}</p></td>
                      <td className="py-2 pr-3 text-muted">{s.use}<br /><span className="text-ink">{s.note}</span></td>
                      <td className={`py-2 font-semibold ${statusStyle[s.status]}`}>{statusText[s.status]}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <section id="integridad" className="scroll-mt-28"><Panel title="Procesamiento e integridad">
            <ul className="grid gap-2 text-sm text-ink">
              <li>• Siniestros se identifican por su código; personas y vehículos se vinculan por el código del siniestro y se anidan, de modo que nunca multiplican siniestros ni víctimas.</li>
              <li>• Fallecidos y lesionados: se cuentan las personas vinculadas con condición registrada; si no hay personas vinculadas se usa el conteo del registro del siniestro. Si ambos existen y difieren, se marca la discrepancia.</li>
              <li>• Valores faltantes permanecen como “sin dato”; nunca se convierten en cero.</li>
              <li>• Deduplicación: clave idéntica con valores idénticos = duplicado; clave idéntica con valores distintos = conflicto, resuelto según la política elegida y registrado.</li>
              <li>• Personas/vehículos sin identificador propio reciben la clave código + orden de aparición en el archivo, lo que permite detectar reimportaciones del mismo archivo.</li>
              <li>• Columnas con datos personales (DNI, nombres, placas, licencias, teléfonos) no se importan.</li>
              <li>• Cada registro conserva archivo, hoja, número de registro, importación y fuente declarada. Los datos se marcan como preliminares cuando así se declara.</li>
              <li>• Las importaciones se aplican de forma atómica: si el guardado falla, la base anterior queda intacta y se registra el fallo.</li>
            </ul>
          </Panel></section>

          <section id="espacial" className="scroll-mt-28"><Panel title="Análisis espacial">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted">Sistema de referencia</dt><dd>WGS84 (EPSG:4326), coordenadas en grados decimales</dd></div>
              <div><dt className="text-xs text-muted">Distancia</dt><dd>Haversine sobre esfera de radio 6 371 008,8 m; resultados en metros</dd></div>
              <div><dt className="text-xs text-muted">Algoritmo</dt><dd>DBSCAN con índice de rejilla</dd></div>
              <div><dt className="text-xs text-muted">Parámetros vigentes</dt><dd>ε = {state.clusterParams.epsMeters} m · mínimo {state.clusterParams.minPts} siniestros (incluido el propio punto)</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted">Validez de coordenadas</dt><dd>Numéricas, distintas de cero, dentro del Perú y de la envolvente rectangular de Arequipa (lat {AREQUIPA_BBOX.minLat} a {AREQUIPA_BBOX.maxLat}, lon {AREQUIPA_BBOX.minLon} a {AREQUIPA_BBOX.maxLon}). La envolvente no es el límite oficial. Coordenadas posiblemente invertidas se marcan, no se corrigen.</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted">Red vial</dt><dd>Sin capa verificada del MTC/Provías. Las concentraciones son agrupaciones de puntos, no tramos; la carretera y la progresiva figuran como “pendiente de validación”. Procedimiento previsto: asociar cada siniestro al eje más cercano dentro de una tolerancia documentada y registrar la distancia.</dd></div>
            </dl>
          </Panel></section>

          <section id="ipiv" className="scroll-mt-28"><Panel title="Índice de Prioridad de Intervención Vial (IPIV)" subtitle={state.weightsVersion}>
            <p className="rounded-md bg-canvas p-3 font-mono text-sm">IPIV = 100 × Σ(wᵢ · xᵢ) / Σwᵢ</p>
            <p className="mt-2 text-sm text-muted">xᵢ: valor del criterio normalizado min–max entre todas las zonas analizadas. La suma se hace solo sobre criterios con dato disponible para la zona; los ausentes se excluyen y los pesos restantes se renormalizan. Si todas las zonas tienen el mismo valor, xᵢ = 1 cuando el valor es positivo.</p>
            <table className="mt-4 w-full text-xs">
              <thead><tr className="border-b border-line text-left text-muted"><th scope="col" className="py-2 font-medium">Criterio</th><th scope="col" className="py-2 font-medium">Definición</th><th scope="col" className="py-2 text-right font-medium">Peso</th></tr></thead>
              <tbody>
                {criteriaDefs.map((c) =>
                  <tr key={c.key} className="border-b border-line/70 align-top"><td className="py-2 pr-2 font-medium">{c.label}</td><td className="py-2 pr-2 text-muted">{c.definition}</td><td className="py-2 text-right tabular-nums">{c.available ? state.weights[c.key].toFixed(3) : 'Excluido'}</td></tr>
                  )}
              </tbody>
            </table>
            <p className="mt-4 text-sm"><span className="font-medium">Categorías (umbrales operativos provisionales, no oficiales):</span> {categoryThresholds.map((t) => `${t.label} ≥ ${t.min}`).join(' · ')}.</p>
            <p className="mt-2 text-sm text-muted">Los pesos deben validarse mediante revisión técnica, consenso experto o AHP. Pueden modificarse en el Ranking sin alterar los datos originales.</p>
          </Panel></section>

          <section id="calidad" className="scroll-mt-28"><Panel title="Índice de confianza y calidad del dato">
            <p className="text-sm">Promedio simple (pesos iguales) de los componentes calculables: validez de coordenadas, integridad de fechas, tipo de siniestro disponible, vinculación de personas, vinculación de vehículos, completitud de 8 variables clave y trazabilidad de la fuente. La coincidencia con red vial se informa como no calculable y queda fuera del índice. Se muestra junto a sus componentes y siempre separado del IPIV.</p>
          </Panel></section>

          <section id="validacion" className="scroll-mt-28"><Panel title="Validación científica temporal"><TemporalValidationPanel /></Panel></section>
          <section id="pruebas" className="scroll-mt-28"><Panel title="Pruebas automáticas del motor"><SelfTestPanel /></Panel></section>

          <section id="limitaciones" className="scroll-mt-28"><Panel title="Limitaciones">
            <ul className="grid gap-2 text-sm text-ink">
              <li>• Las cuatro bases originales no están presentes en este entorno: el sistema no muestra cifras hasta que se importan.</li>
              <li>• El procesamiento corre en el navegador y la base se guarda localmente (IndexedDB). No hay servidor, PostgreSQL/PostGIS ni autenticación; los datos no se comparten entre equipos.</li>
              <li>• Los archivos derivados se exportan en JSON; el formato Parquet no está disponible en el navegador.</li>
              <li>• Sin red vial, exposición vehicular ni capas de entorno, el IPIV mide carga histórica de siniestros fatales registrados, no riesgo.</li>
              <li>• La base detallada contiene siniestros fatales: los lesionados solo reflejan los registrados en esos siniestros.</li>
              <li>• Los datos son preliminares y pueden cambiar en versiones posteriores de la fuente.</li>
            </ul>
          </Panel></section>
        </div>
      </div>
    </main>);

}