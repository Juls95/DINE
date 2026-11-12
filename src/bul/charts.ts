import { movingAverage } from "./stats";
import type { Inputs } from "./load";
import type { Analysis } from "./types";

export type ChartDef = {
  id: string;
  title: string;
  agent: "bison" | "beary" | "bul";
  query_file: string | null;
  endpoint: string | null;
  /** Plain sentence with placeholders; rendered and checked by `verify`. */
  sentence: string;
  spec: Record<string, unknown>;
};

const SCHEMA = "https://vega.github.io/schema/vega-lite/v6.json";
const base = { $schema: SCHEMA, width: "container", height: 240, config: { axis: { labelFontSize: 11 }, legend: { orient: "bottom" } } };
const Q = (id: string) => `src/bison/bq/queries/${id}.sql`;

export function buildCharts(inputs: Inputs, a: Analysis): ChartDef[] {
  const { bison } = inputs;
  const daa = bison.daily_activity;
  const ma = movingAverage(daa.map((d) => d.daily_active_accounts), 7);

  return [
    {
      id: "daa", title: "Cuentas activas diarias", agent: "bison", query_file: Q("daily_activity"), endpoint: null,
      sentence: "La diferencia entre la mediana de treinta días de cuentas activas y la de noventa días es {{metric:daa_30d_vs_90d_pct}}; el régimen es {{label:regime}}.",
      spec: {
        ...base,
        data: { values: daa.map((d, i) => ({ date: d.date, valor: d.daily_active_accounts, media7: ma[i] })) },
        layer: [
          { mark: { type: "line", opacity: 0.35 }, encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "valor", type: "quantitative", title: "Cuentas" } } },
          { mark: { type: "line", strokeWidth: 2 }, encoding: { x: { field: "date", type: "temporal" }, y: { field: "media7", type: "quantitative" } } },
        ],
      },
    },
    {
      id: "transactions", title: "Transacciones diarias", agent: "bison", query_file: Q("daily_activity"), endpoint: null,
      sentence: "La mediana de transacciones diarias cambió {{metric:tx_30d_change_pct}} contra los treinta días previos.",
      spec: { ...base, data: { values: daa.map((d) => ({ date: d.date, valor: d.transactions })) }, mark: "area",
        encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "valor", type: "quantitative", title: "Transacciones" } } },
    },
    {
      id: "new_accounts", title: "Cuentas creadas por día", agent: "bison", query_file: Q("new_accounts"), endpoint: null,
      sentence: "En los últimos treinta días se crearon {{metric:new_accounts_30d}} cuentas ({{metric:new_accounts_30d_change_pct}} contra la ventana previa).",
      spec: { ...base, data: { values: bison.new_accounts.map((d) => ({ date: d.date, valor: d.new_accounts })) }, mark: "bar",
        encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "valor", type: "quantitative", title: "Cuentas nuevas" } } },
    },
    {
      id: "intents_share", title: "Participación del contrato de Intents en las llamadas", agent: "bison", query_file: Q("contract_activity"), endpoint: null,
      sentence: "El contrato de Intents recibe {{metric:intents_call_share_30d}} de las llamadas a contratos, {{metric:intents_call_share_change_pp}} contra la ventana previa.",
      spec: { ...base, data: { values: bison.contract_activity.map((d) => ({ date: d.date, pct: d.function_calls ? (d.intents_calls / d.function_calls) * 100 : null })) },
        mark: "line", encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "pct", type: "quantitative", title: "% de llamadas" } } },
    },
    {
      id: "top_contracts", title: "Contratos con más llamadas (últimos treinta días)", agent: "bison", query_file: Q("contract_usage"), endpoint: null,
      sentence: "En treinta días hubo una mediana de {{metric:active_contracts_median_30d}} contratos activos por día y {{metric:deploys_30d}} despliegues.",
      spec: { ...base, height: 200,
        data: { values: topContracts(inputs) },
        mark: "bar", encoding: { y: { field: "contract", type: "nominal", sort: "-x", title: null }, x: { field: "calls", type: "quantitative", title: "Llamadas" } } },
    },
    {
      id: "concentration", title: "Participación de los diez signers más activos", agent: "bison", query_file: Q("concentration"), endpoint: null,
      sentence: "La mediana de treinta días es {{metric:top10_share_median_30d}}. Saltos clasificados como pico, no como adopción: {{metric:spikes_pico}}.",
      spec: { ...base, data: { values: bison.concentration.map((d) => ({ date: d.date, pct: d.total_transactions ? (d.top10_transactions / d.total_transactions) * 100 : null })) },
        mark: "line", encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "pct", type: "quantitative", title: "% de transacciones" } } },
    },
    {
      id: "meta_tx", title: "Meta-transacciones (acciones delegadas)", agent: "bison", query_file: Q("meta_tx"), endpoint: null,
      sentence: "Las acciones delegadas son {{metric:meta_tx_share_30d}} del total; una mediana de {{metric:delegating_accounts_median_30d}} cuentas al día las usa.",
      spec: { ...base, data: { values: bison.meta_tx.map((d) => ({ date: d.date, pct: d.total_actions ? (d.delegate_actions / d.total_actions) * 100 : null })) },
        mark: "line", encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "pct", type: "quantitative", title: "% de acciones" } } },
    },
    {
      id: "intents_volume", title: "Volumen diario de 1Click Swap (USD)", agent: "bison", query_file: null,
      endpoint: "GET https://explorer.near-intents.org/api/v0/transactions?statuses=SUCCESS",
      sentence: "El volumen de 1Click en treinta días fue {{metric:intents_volume_30d_usd}} ({{metric:intents_volume_30d_change_pct}} contra la ventana previa).",
      spec: { ...base, data: { values: bison.intents_daily.map((d) => ({ date: d.date, usd: d.volume_usd })) }, mark: "bar",
        encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "usd", type: "quantitative", title: "USD" } } },
    },
    {
      id: "lag", title: "Correlación con rezago: 1Click frente a cuentas activas", agent: "bul", query_file: Q("daily_activity"),
      endpoint: "GET https://explorer.near-intents.org/api/v0/transactions?statuses=SUCCESS",
      sentence: "La correlación máxima es {{metric:lag_best_r}} con {{metric:lag_best_days}} de rezago; en sentido inverso llega a {{metric:lag_reverse_best_r}}.",
      spec: { ...base,
        data: { values: a.lag.flatMap((p) => [{ lag: p.lag, sentido: "1Click → cuentas", r: p.forward }, { lag: p.lag, sentido: "cuentas → 1Click", r: p.reverse }]) },
        mark: "line", encoding: { x: { field: "lag", type: "ordinal", title: "Rezago (días)" }, y: { field: "r", type: "quantitative", title: "r", scale: { domain: [-1, 1] } }, color: { field: "sentido", type: "nominal", title: null } } },
    },
    {
      id: "sentiment", title: "Sentimiento semanal ponderado por credibilidad", agent: "beary", query_file: null,
      endpoint: "POST https://api.x.ai/v1/responses (tool: x_search)",
      sentence: "El índice de la última semana es {{metric:sentiment_index_last_week}} contra {{metric:sentiment_index_prev_week}} la semana previa. Semanas de espejismo: {{metric:mirage_weeks}}.",
      spec: { ...base,
        data: { values: a.divergences.map((d) => ({ semana: d.week, sentimiento: d.sentiment_index, tipo: d.reconstructed ? "reconstruida" : "en vivo" })) },
        mark: { type: "bar" }, encoding: { x: { field: "semana", type: "ordinal", title: null }, y: { field: "sentimiento", type: "quantitative", title: "Índice", scale: { domain: [-1, 1] } }, color: { field: "tipo", type: "nominal", title: null } } },
    },
  ];
}

function topContracts(inputs: Inputs) {
  const end = inputs.manifest.window.end;
  const from = new Date(new Date(`${end}T00:00:00Z`).getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const totals = new Map<string, number>();
  for (const r of inputs.bison.contract_usage) if (r.date >= from) totals.set(r.contract, (totals.get(r.contract) ?? 0) + r.calls);
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([contract, calls]) => ({ contract, calls }));
}
