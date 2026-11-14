import { PARAMS } from "./params";
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
      id: "daa", title: "Daily active accounts", agent: "bison", query_file: Q("daily_activity"), endpoint: null,
      sentence: "The thirty-day median of active accounts sits {{metric:daa_30d_vs_90d_pct}} from the ninety-day median; the regime is {{label:regime}}.",
      spec: {
        ...base,
        data: { values: daa.map((d, i) => ({ date: d.date, value: d.daily_active_accounts, avg7: ma[i] })) },
        layer: [
          { mark: { type: "line", opacity: 0.35 }, encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "value", type: "quantitative", title: "Accounts" } } },
          { mark: { type: "line", strokeWidth: 2 }, encoding: { x: { field: "date", type: "temporal" }, y: { field: "avg7", type: "quantitative" } } },
        ],
      },
    },
    {
      id: "transactions", title: "Daily transactions", agent: "bison", query_file: Q("daily_activity"), endpoint: null,
      sentence: "The median of daily transactions changed {{metric:tx_30d_change_pct}} against the previous thirty days.",
      spec: { ...base, data: { values: daa.map((d) => ({ date: d.date, value: d.transactions })) }, mark: "area",
        encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "value", type: "quantitative", title: "Transactions" } } },
    },
    {
      id: "new_accounts", title: "Accounts created per day", agent: "bison", query_file: Q("new_accounts"), endpoint: null,
      sentence: "{{metric:new_accounts_30d}} accounts were created in the last thirty days ({{metric:new_accounts_30d_change_pct}} against the previous window).",
      spec: { ...base, data: { values: bison.new_accounts.map((d) => ({ date: d.date, value: d.new_accounts })) }, mark: "bar",
        encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "value", type: "quantitative", title: "New accounts" } } },
    },
    {
      id: "intents_share", title: "Intents contract share of calls", agent: "bison", query_file: Q("contract_activity"), endpoint: null,
      sentence: "The Intents contract receives {{metric:intents_call_share_30d}} of contract calls, {{metric:intents_call_share_change_pp}} against the previous window.",
      spec: { ...base, data: { values: bison.contract_activity.map((d) => ({ date: d.date, pct: d.function_calls ? (d.intents_calls / d.function_calls) * 100 : null })) },
        mark: "line", encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "pct", type: "quantitative", title: "% of calls" } } },
    },
    {
      id: "top_contracts", title: "Most-called contracts (last thirty days)", agent: "bison", query_file: Q("contract_usage"), endpoint: null,
      sentence: "Over thirty days the median was {{metric:active_contracts_median_30d}} active contracts per day, with {{metric:deploys_30d}} deployments.",
      spec: { ...base, height: 200,
        data: { values: topContracts(inputs) },
        mark: "bar", encoding: { y: { field: "contract", type: "nominal", sort: "-x", title: null }, x: { field: "calls", type: "quantitative", title: "Calls" } } },
    },
    {
      id: "concentration", title: "Share of the ten most active signers", agent: "bison", query_file: Q("concentration"), endpoint: null,
      sentence: "The thirty-day median is {{metric:top10_share_median_30d}}. Jumps classified as spikes, not adoption: {{metric:spikes_nonstructural}}.",
      spec: { ...base, data: { values: bison.concentration.map((d) => ({ date: d.date, pct: d.total_transactions ? (d.top10_transactions / d.total_transactions) * 100 : null })) },
        mark: "line", encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "pct", type: "quantitative", title: "% of transactions" } } },
    },
    {
      id: "meta_tx", title: "Meta-transactions (delegated actions)", agent: "bison", query_file: Q("meta_tx"), endpoint: null,
      sentence: "Delegated actions are {{metric:meta_tx_share_30d}} of the total; a median of {{metric:delegating_accounts_median_30d}} accounts per day use them.",
      spec: { ...base, data: { values: bison.meta_tx.map((d) => ({ date: d.date, pct: d.total_actions ? (d.delegate_actions / d.total_actions) * 100 : null })) },
        mark: "line", encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "pct", type: "quantitative", title: "% of actions" } } },
    },
    {
      id: "intents_volume", title: "Daily 1Click Swap volume (USD)", agent: "bison", query_file: null,
      endpoint: "GET https://explorer.near-intents.org/api/v0/transactions?statuses=SUCCESS",
      sentence: "Thirty-day 1Click volume was {{metric:intents_volume_30d_usd}} ({{metric:intents_volume_30d_change_pct}} against the previous window).",
      spec: { ...base, data: { values: bison.intents_daily.map((d) => ({ date: d.date, usd: d.volume_usd })) }, mark: "bar",
        encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "usd", type: "quantitative", title: "USD" } } },
    },
    {
      id: "lag", title: "Lagged correlation: 1Click versus active accounts", agent: "bul", query_file: Q("daily_activity"),
      endpoint: "GET https://explorer.near-intents.org/api/v0/transactions?statuses=SUCCESS",
      sentence: "The peak correlation is {{metric:lag_best_r}} at a lag of {{metric:lag_best_days}}; in the reverse direction it reaches {{metric:lag_reverse_best_r}}.",
      spec: { ...base,
        data: { values: a.lag.flatMap((p) => [{ lag: p.lag, direction: "1Click → accounts", r: p.forward }, { lag: p.lag, direction: "accounts → 1Click", r: p.reverse }]) },
        mark: "line", encoding: { x: { field: "lag", type: "ordinal", title: "Lag (days)" }, y: { field: "r", type: "quantitative", title: "r", scale: { domain: [-1, 1] } }, color: { field: "direction", type: "nominal", title: null } } },
    },
    {
      id: "sentiment", title: "Credibility-weighted weekly sentiment", agent: "beary", query_file: null,
      endpoint: "POST https://api.x.ai/v1/responses (tool: x_search)",
      sentence: "Last week's index is {{metric:sentiment_index_last_week}} against {{metric:sentiment_index_prev_week}} the week before. Mirage weeks: {{metric:mirage_weeks}}.",
      spec: { ...base,
        data: { values: a.divergences.map((d) => ({ week: d.week, sentiment: d.sentiment_index, kind: d.reconstructed ? "reconstructed" : "live" })) },
        mark: { type: "bar" }, encoding: { x: { field: "week", type: "ordinal", title: null }, y: { field: "sentiment", type: "quantitative", title: "Index", scale: { domain: [-1, 1] } }, color: { field: "kind", type: "nominal", title: null } } },
    },
    ...priceCharts(inputs, a),
  ];
}

const PRICE_ENDPOINT = "data/raw/price/near.json and data/raw/price/btc.json (daily candles; the price source is configured outside this repo)";

/** Technical charts exist only when price candles are present; otherwise the thesis says the metrics are not available. */
function priceCharts(inputs: Inputs, a: Analysis): ChartDef[] {
  if (!inputs.price) return [];
  const near = inputs.price.near.bars;
  const closes = near.map((b) => b.close);
  const fast = movingAverage(closes, PARAMS.sma_fast_days);
  const slow = movingAverage(closes, PARAMS.sma_slow_days);
  const shown = 260;
  const from = Math.max(0, near.length - shown);
  const m = (id: string) => a.metrics[id]?.value ?? null;
  const rules = [
    { level: m("range_high"), kind: "range high" },
    { level: m("range_median"), kind: "range median" },
    { level: m("range_low"), kind: "range low" },
    ...a.npocs.map((n) => ({ level: n.level, kind: `open nPOC (${n.side})` })),
  ].filter((r) => r.level !== null);
  const btc = inputs.price.btc.bars;
  const span = 120;
  const nearTail = near.slice(-span);
  const btcTail = btc.slice(-span);
  const index = (bars: typeof near) => bars.map((b) => ({ date: b.date, value: (b.close / (bars[0]?.close ?? b.close)) * 100 }));
  return [
    {
      id: "price_technical", title: "NEAR price with averages, range and open nPOC levels", agent: "bison", query_file: null, endpoint: PRICE_ENDPOINT,
      sentence: "NEAR closes {{metric:near_vs_sma_slow_pct}} from its slow average, sits {{metric:range_position_pct}} of the way up its range and has {{metric:npoc_open_total}} open nPOC levels.",
      spec: {
        ...base,
        height: 280,
        layer: [
          { data: { values: near.slice(from).map((b, i) => ({ date: b.date, close: b.close, fast: fast[from + i], slow: slow[from + i] })) },
            transform: [{ fold: ["close", "fast", "slow"], as: ["series", "price"] }],
            mark: { type: "line", strokeWidth: 1.6 },
            encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "price", type: "quantitative", title: "USD", scale: { zero: false } }, color: { field: "series", type: "nominal", title: null } } },
          { data: { values: rules }, mark: { type: "rule", strokeDash: [4, 4], opacity: 0.7 },
            encoding: { y: { field: "level", type: "quantitative" }, color: { field: "kind", type: "nominal", title: null } } },
        ],
      },
    },
    {
      id: "near_vs_btc", title: "NEAR against BTC, indexed to the start of the window", agent: "bul", query_file: null, endpoint: PRICE_ENDPOINT,
      sentence: "Over {{param:rs_lookback_days}} days NEAR returned {{metric:near_return_30d_pct}} and BTC {{metric:btc_return_30d_pct}}; the beta of NEAR to BTC is {{metric:near_beta_90d}}.",
      spec: {
        ...base,
        data: { values: [...index(nearTail).map((d) => ({ ...d, series: "NEAR" })), ...index(btcTail).map((d) => ({ ...d, series: "BTC" }))] },
        mark: "line",
        encoding: { x: { field: "date", type: "temporal", title: null }, y: { field: "value", type: "quantitative", title: "Index", scale: { zero: false } }, color: { field: "series", type: "nominal", title: null } },
      },
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
