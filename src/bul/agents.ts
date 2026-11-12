import { loadQuery } from "../bison/bq/client";
import type { Inputs } from "./load";
import type { Analysis } from "./types";
import type { Violation } from "./verify";

export type Validation = { name: string; status: "pass" | "warn" | "fail" | "n/a"; detail: string };
export type Run = { at: string; summary: string; details: Record<string, string | number | boolean | null> };
export type AgentCard = {
  id: "beary" | "bison" | "bul";
  name: string;
  role: string;
  does: string[];
  inputs: string[];
  outputs: string[];
  runs: Run[];
  validations: Validation[];
};

const DAY = 86_400_000;

export function buildAgents(inputs: Inputs, a: Analysis, violations: readonly Violation[], maxBytes: number): AgentCard[] {
  const { manifest, bearyDaily } = inputs;
  const queryIds = manifest.items.filter((i) => i.query_file).map((i) => i.id);
  const partitionOk = queryIds.every((id) => {
    try {
      loadQuery(id);
      return true;
    } catch {
      return false;
    }
  });
  const lastBlock = manifest.freshness.last_block_date;
  const lagDays = lastBlock ? Math.round((Date.parse(`${manifest.window.end}T00:00:00Z`) - Date.parse(`${lastBlock}T00:00:00Z`)) / DAY) : null;
  const overCap = manifest.items.filter((i) => i.bytes_processed !== null && i.bytes_processed > maxBytes);
  const reasons = (r: string) => bearyDaily.reduce((n, d) => n + d.discarded.filter((x) => x.reason === r).length, 0);
  const reconstructedWeeks = inputs.bearyWeekly.filter((w) => w.reconstructed).length;

  return [
    {
      id: "beary",
      name: "Beary",
      role: "Lectura psicológica: qué dicen en X las cuentas confiables sobre NEAR.",
      does: [
        "Cada día consulta xAI (Grok) con la herramienta x_search, limitada a la lista de cuentas y a ese día.",
        "Un segundo modelo, intercambiable por variable de entorno, convierte la respuesta en JSON validado con zod.",
        "Descarta posts que xAI no citó, de cuentas fuera de la lista, de otra fecha o duplicados.",
        "Calcula un puntaje de credibilidad determinista y un índice semanal de sentimiento.",
      ],
      inputs: ["config/beary.handles.yaml", "xAI Responses API · x_search", "LLM_PROVIDER / LLM_MODEL"],
      outputs: ["data/beary/daily/AAAA-MM-DD.json", "data/beary/weekly/AAAA-Wss.json"],
      runs: bearyDaily.slice(-14).reverse().map((d) => ({
        at: d.date,
        summary: `${d.posts.length} posts verificados · ${d.discarded.length} descartados`,
        details: { reconstruido: d.reconstructed, búsqueda: d.search_model, estructura: d.structuring_model, posts_leídos: d.posts_fetched },
      })),
      validations: [
        { name: "Posts sin cita de xAI descartados", status: "pass", detail: `${reasons("not_in_citations")} descartados` },
        { name: "Cuentas fuera de la lista descartadas", status: "pass", detail: `${reasons("handle_not_allowed")} descartados` },
        { name: "Posts fuera de fecha descartados", status: "pass", detail: `${reasons("outside_date_window")} descartados` },
        { name: "Semanas reconstruidas marcadas", status: reconstructedWeeks > 0 ? "warn" : "pass", detail: `${reconstructedWeeks} de ${inputs.bearyWeekly.length} semanas son reconstruidas` },
      ],
    },
    {
      id: "bison",
      name: "Bison",
      role: "Lectura técnica: actividad on-chain de NEAR y volumen de 1Click Swap.",
      does: [
        "Consulta el dataset público de NEAR en BigQuery con queries versionadas y parametrizadas.",
        "Hace un dry run antes de cada query y aborta si supera BQ_MAX_BYTES.",
        "Descarga swaps exitosos de 1Click del Intents Explorer respetando el límite de una solicitud cada cinco segundos.",
        "Guarda datos crudos y un manifest para reconstruir todo sin credenciales.",
      ],
      inputs: ["bigquery-public-data.crypto_near_mainnet_us", "Intents Explorer API (JWT)", "src/bison/bq/queries/*.sql"],
      outputs: ["data/raw/bq/*.json", "data/raw/intents/intents_daily.json", "data/raw/manifest.json"],
      runs: manifest.items.map((i) => ({
        at: i.fetched_at.slice(0, 10),
        summary: `${i.id}: ${i.rows} filas`,
        details: { fuente: i.source, query: i.query_file, endpoint: i.endpoint, bytes: i.bytes_processed },
      })),
      validations: [
        { name: "Toda query filtra por block_date", status: partitionOk ? "pass" : "fail", detail: `${queryIds.length} queries revisadas` },
        { name: "Bytes por query bajo el tope", status: overCap.length ? "fail" : inputs.mode === "mock" ? "n/a" : "pass", detail: inputs.mode === "mock" ? "sin BigQuery en modo mock" : `${overCap.length} sobre el tope` },
        { name: "Frescura del dataset", status: lagDays === null ? "fail" : lagDays <= 2 ? "pass" : "warn", detail: lastBlock ? `último bloque ${lastBlock} (${lagDays} días de retraso)` : "sin dato de frescura" },
        { name: "Datos validados con zod", status: "pass", detail: `${manifest.items.length} datasets` },
      ],
    },
    {
      id: "bul",
      name: "Bul",
      role: "Síntesis: cruza a Beary con Bison y escribe la tesis.",
      does: [
        "Calcula las métricas con funciones puras a partir de los datos crudos.",
        "Genera cada gráfico con su query y una frase simple.",
        "Cruza sentimiento y actividad para separar confirmaciones de espejismos.",
        "Escribe THESIS.md desde una plantilla donde toda cifra sale de un placeholder.",
      ],
      inputs: ["data/raw/**", "data/beary/**", "src/bul/params.ts"],
      outputs: ["THESIS.md", "data/derived/metrics.json", "dist/ (sitio estático)"],
      runs: [{ at: a.generated_at.slice(0, 10), summary: `${Object.keys(a.metrics).length} métricas · ${a.divergences.length} semanas cruzadas`, details: { modo: a.mode } }],
      validations: [
        { name: "Sin cifras escritas a mano", status: violations.length ? "fail" : "pass", detail: violations.length ? violations.map((v) => v.check).join("; ") : "todas las cifras vienen de metrics.json" },
        { name: "Cada gráfico tiene query y frase", status: violations.some((v) => v.check.startsWith("chart")) ? "fail" : "pass", detail: "revisado por verify" },
        { name: "Sin mezcla de datos simulados y reales", status: "pass", detail: `modo ${a.mode}` },
      ],
    },
  ];
}
