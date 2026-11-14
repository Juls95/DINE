import { addDays, weekStart } from "../lib/dates";
import type { PriceBar, PriceSeries } from "../schemas/market";
import { PARAMS } from "./params";
import { mean, pctChange } from "./stats";
import type { ConfluenceItem, Metric, MetricUnit, Npoc } from "./types";

export const FIB = [0.382, 0.5, 0.618, 0.786] as const;

export type PriceData = { near: PriceSeries; btc: PriceSeries };

export function sma(values: readonly number[], n: number): number | null {
  return values.length < n ? null : mean(values.slice(-n));
}

/** Wilder's RSI over the whole series. */
export function rsi(closes: readonly number[], n: number): number | null {
  if (closes.length < n + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = (closes[i] as number) - (closes[i - 1] as number);
    gain += Math.max(d, 0);
    loss += Math.max(-d, 0);
  }
  let avgGain = gain / n;
  let avgLoss = loss / n;
  for (let i = n + 1; i < closes.length; i++) {
    const d = (closes[i] as number) - (closes[i - 1] as number);
    avgGain = (avgGain * (n - 1) + Math.max(d, 0)) / n;
    avgLoss = (avgLoss * (n - 1) + Math.max(-d, 0)) / n;
  }
  return avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
}

function trueRange(bar: PriceBar, prevClose: number | null): number {
  const base = bar.high - bar.low;
  return prevClose === null ? base : Math.max(base, Math.abs(bar.high - prevClose), Math.abs(bar.low - prevClose));
}

/**
 * Open nPOC levels on daily bars. A fast, body-dominated candle (true range at least `impulseAtr` times the prior ATR)
 * leaves an unfilled print at the middle of its body. The level stays open until a later candle CLOSES at or through it
 * (a wick does not count). This is a daily-bar approximation of the intraday method; see the thesis methodology section.
 */
export function findNpocs(
  bars: readonly PriceBar[],
  opts: { atrDays: number; impulseAtr: number; bodySharePct: number },
): { open: Npoc[]; created: Npoc[] } {
  const trs = bars.map((b, i) => trueRange(b, i === 0 ? null : (bars[i - 1] as PriceBar).close));
  const lastClose = (bars.at(-1) as PriceBar).close;
  const all: { npoc: Npoc; index: number; dir: 1 | -1 }[] = [];
  for (let i = opts.atrDays + 1; i < bars.length; i++) {
    const bar = bars[i] as PriceBar;
    const atr = mean(trs.slice(i - opts.atrDays, i));
    const range = bar.high - bar.low;
    if (!atr || range <= 0) continue;
    const body = Math.abs(bar.close - bar.open);
    if ((trs[i] as number) < opts.impulseAtr * atr || (body / range) * 100 < opts.bodySharePct) continue;
    const dir = bar.close > bar.open ? 1 : -1;
    const level = (bar.open + bar.close) / 2;
    all.push({ npoc: { created: bar.date, level, side: level < lastClose ? "lower" : "upper" }, index: i, dir });
  }
  const isOpen = (x: (typeof all)[number]) =>
    !bars.slice(x.index + 1).some((b) => (x.dir === 1 ? b.close <= x.npoc.level : b.close >= x.npoc.level));
  return { open: all.filter(isOpen).map((x) => x.npoc), created: all.map((x) => x.npoc) };
}

export function rangeFramework(bars: readonly PriceBar[], lookback: number) {
  const w = bars.slice(-lookback);
  const high = Math.max(...w.map((b) => b.high));
  const low = Math.min(...w.map((b) => b.low));
  return { high, low, median: (high + low) / 2, fib: Object.fromEntries(FIB.map((r) => [r, low + r * (high - low)])) as Record<number, number> };
}

/** Last close of each Monday-based week, ascending. The final entry is the week to date. */
export function weeklyCloses(bars: readonly PriceBar[]): number[] {
  const byWeek = new Map<string, number>();
  for (const b of bars) byWeek.set(weekStart(b.date), b.close);
  return [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, close]) => close);
}

function closeOnOrBefore(bars: readonly PriceBar[], date: string): number | null {
  for (let i = bars.length - 1; i >= 0; i--) if ((bars[i] as PriceBar).date <= date) return (bars[i] as PriceBar).close;
  return null;
}

function logReturns(bars: readonly PriceBar[]): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 1; i < bars.length; i++) out.set((bars[i] as PriceBar).date, Math.log((bars[i] as PriceBar).close / (bars[i - 1] as PriceBar).close));
  return out;
}

/** Beta and correlation of NEAR daily log returns against BTC over the last `lookback` common days. */
export function betaToBtc(near: readonly PriceBar[], btc: readonly PriceBar[], lookback: number) {
  const a = logReturns(near);
  const b = logReturns(btc);
  const dates = [...a.keys()].filter((d) => b.has(d)).sort().slice(-lookback);
  if (dates.length < 10) return { beta: null, corr: null };
  const x = dates.map((d) => b.get(d) as number);
  const y = dates.map((d) => a.get(d) as number);
  const mx = mean(x) as number;
  const my = mean(y) as number;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < x.length; i++) {
    cov += ((x[i] as number) - mx) * ((y[i] as number) - my);
    vx += ((x[i] as number) - mx) ** 2;
    vy += ((y[i] as number) - my) ** 2;
  }
  return { beta: vx === 0 ? null : cov / vx, corr: vx === 0 || vy === 0 ? null : cov / Math.sqrt(vx * vy) };
}

export type TripwireState = "intact" | "breached, regain window open" | "triggered";

/** Weekly closes against a rolling weekly average; mirrors the "lose the average and fail to regain it" tripwire logic. */
export function btcRegime(closes: readonly number[], wmaWeeks: number, regainWeeks: number) {
  if (closes.length < wmaWeeks) return null;
  const wmaAt = (k: number) => mean(closes.slice(k - wmaWeeks + 1, k + 1)) as number;
  const last = closes.length - 1;
  let run = 0;
  for (let k = last; k >= wmaWeeks - 1 && (closes[k] as number) < wmaAt(k); k--) run++;
  const state: TripwireState = run === 0 ? "intact" : run >= regainWeeks ? "triggered" : "breached, regain window open";
  return { wma: wmaAt(last), close: closes[last] as number, weeksBelow: run, state };
}

type Spec = readonly [id: string, label: string, unit: MetricUnit];

const SPEC: readonly Spec[] = [
  ["near_close", "NEAR last daily close", "usd2"],
  ["near_sma_fast", "NEAR fast moving average (daily)", "usd2"],
  ["near_sma_slow", "NEAR slow moving average (daily)", "usd2"],
  ["near_vs_sma_slow_pct", "NEAR close versus the slow average", "pct"],
  ["near_rsi", "NEAR RSI (daily)", "ratio"],
  ["range_high", "Range high", "usd2"],
  ["range_low", "Range low", "usd2"],
  ["range_median", "Range median (ML)", "usd2"],
  ["range_position_pct", "Position of the close inside the range", "pct"],
  ["fib_382", "Fibonacci 0.382 level of the range", "usd2"],
  ["fib_618", "Fibonacci 0.618 level of the range", "usd2"],
  ["fib_786", "Fibonacci 0.786 level of the range", "usd2"],
  ["fib_nearest_pct", "Distance from the close to the nearest Fibonacci level", "pct"],
  ["npoc_open_lower", "Open nPOC levels below the close", "count"],
  ["npoc_open_upper", "Open nPOC levels above the close", "count"],
  ["npoc_open_total", "Open nPOC levels", "count"],
  ["npoc_created_30d", "nPOC prints created in the last thirty days", "count"],
  ["npoc_lower_level", "Nearest open nPOC below the close", "usd2"],
  ["npoc_lower_distance_pct", "Distance to the nearest lower nPOC", "pct"],
  ["npoc_upper_level", "Nearest open nPOC above the close", "usd2"],
  ["npoc_upper_distance_pct", "Distance to the nearest upper nPOC", "pct"],
  ["near_return_30d_pct", "NEAR return (thirty days)", "pct"],
  ["btc_return_30d_pct", "BTC return (thirty days)", "pct"],
  ["rs_vs_btc_30d_pp", "NEAR minus BTC return (thirty days)", "pp"],
  ["near_beta_90d", "NEAR beta to BTC (daily log returns)", "ratio"],
  ["near_btc_corr_90d", "NEAR to BTC correlation (daily log returns)", "corr"],
  ["btc_close", "BTC last daily close", "usd"],
  ["btc_wma", "BTC weekly moving average", "usd"],
  ["btc_vs_wma_pct", "BTC weekly close versus its weekly average", "pct"],
  ["btc_weeks_below_wma", "Consecutive BTC weekly closes below the weekly average", "count"],
  ["btc_drawdown_pct", "BTC drawdown from its fifty-two-week closing high", "pct"],
  ["confluence_score", "Technical checks met", "count"],
  ["confluence_total", "Technical checks evaluated", "count"],
  ["plan_entry", "Illustrative entry (nearest lower nPOC)", "usd2"],
  ["plan_stop", "Illustrative stop beyond the nPOC", "usd2"],
  ["plan_t1", "Illustrative first target (range median)", "usd2"],
  ["plan_t2", "Illustrative second target", "usd2"],
  ["plan_rr", "Reward-to-risk to the first target", "ratio"],
  ["plan_size_units", "Illustrative position size in NEAR", "count"],
  ["plan_risk_usd", "Illustrative amount at risk", "usd"],
  ["plan_account_usd", "Example account size for the risk template", "usd"],
];

export type TechnicalResult = {
  values: Record<string, number | null>;
  labels: Record<string, string>;
  confluence: ConfluenceItem[];
  npocs: Npoc[];
  source: string;
};

const CRITERIA = [
  ["above_slow", "The close is above the slow daily average"],
  ["above_fast", "The close is above the fast daily average"],
  ["weekly_up", "The weekly close is above the weekly average"],
  ["discount", "The close sits in the discount half of the range"],
  ["npoc_near", "An open nPOC sits close below the close"],
  ["rsi_ok", "RSI is not overbought"],
  ["rs_positive", "NEAR is outperforming BTC"],
  ["regime_up", "The on-chain adoption regime is expansion"],
] as const;

/** Pure computation of the whole technical layer. With no price data every value is null and the labels say so. */
export function computeTechnical(price: PriceData | null, regime: string | null): TechnicalResult {
  const values: Record<string, number | null> = Object.fromEntries(SPEC.map(([id]) => [id, null]));
  values.plan_account_usd = PARAMS.example_account_usd;
  const labels: Record<string, string> = {
    near_trend: "no data", near_weekly_trend: "no data", range_zone: "no data", fib_nearest: "no data",
    btc_tripwire: "no data", technical_bias: "no data", plan_status: "no data",
  };
  const empty: ConfluenceItem[] = CRITERIA.map(([id, text]) => ({ id, text, met: null }));
  if (!price) return { values, labels, confluence: empty, npocs: [], source: "not available" };

  const near = price.near.bars;
  const btc = price.btc.bars;
  const closes = near.map((b) => b.close);
  const last = near.at(-1) as PriceBar;
  const close = last.close;
  const fast = sma(closes, PARAMS.sma_fast_days);
  const slow = sma(closes, PARAMS.sma_slow_days);
  const rsiNow = rsi(closes, PARAMS.rsi_days);
  const range = rangeFramework(near, PARAMS.range_lookback_days);
  const position = range.high > range.low ? ((close - range.low) / (range.high - range.low)) * 100 : null;
  const weekly = weeklyCloses(near);
  const weeklySma = sma(weekly, PARAMS.weekly_sma_weeks);
  const npoc = findNpocs(near, { atrDays: PARAMS.atr_days, impulseAtr: PARAMS.npoc_impulse_atr, bodySharePct: PARAMS.npoc_body_share_pct });
  const lower = npoc.open.filter((n) => n.side === "lower").sort((a, b) => b.level - a.level);
  const upper = npoc.open.filter((n) => n.side === "upper").sort((a, b) => a.level - b.level);
  const dist = (level: number) => Math.abs(level - close) / close * 100;
  const cutoff = addDays(last.date, -PARAMS.window_days);

  const fibLevels = FIB.map((r) => ({ r, level: range.fib[r] as number }));
  const nearestFib = fibLevels.reduce((best, f) => (Math.abs(f.level - close) < Math.abs(best.level - close) ? f : best));

  const nearRet = pctChange(close, closeOnOrBefore(near, addDays(last.date, -PARAMS.rs_lookback_days)));
  const btcLast = btc.at(-1) as PriceBar;
  const btcRet = pctChange(btcLast.close, closeOnOrBefore(btc, addDays(btcLast.date, -PARAMS.rs_lookback_days)));
  const { beta, corr } = betaToBtc(near, btc, PARAMS.beta_lookback_days);

  const btcWeekly = weeklyCloses(btc);
  const reg = btcRegime(btcWeekly, PARAMS.btc_wma_weeks, PARAMS.tripwire_regain_weeks);
  const btcCloses = btc.slice(-364).map((b) => b.close);
  const btcHigh = Math.max(...btcCloses);

  Object.assign(values, {
    near_close: close, near_sma_fast: fast, near_sma_slow: slow,
    near_vs_sma_slow_pct: slow ? pctChange(close, slow) : null,
    near_rsi: rsiNow,
    range_high: range.high, range_low: range.low, range_median: range.median, range_position_pct: position,
    fib_382: range.fib[0.382], fib_618: range.fib[0.618], fib_786: range.fib[0.786],
    fib_nearest_pct: dist(nearestFib.level),
    npoc_open_lower: lower.length, npoc_open_upper: upper.length, npoc_open_total: npoc.open.length,
    npoc_created_30d: npoc.created.filter((n) => n.created > cutoff).length,
    npoc_lower_level: lower[0]?.level ?? null, npoc_lower_distance_pct: lower[0] ? dist(lower[0].level) : null,
    npoc_upper_level: upper[0]?.level ?? null, npoc_upper_distance_pct: upper[0] ? dist(upper[0].level) : null,
    near_return_30d_pct: nearRet, btc_return_30d_pct: btcRet,
    rs_vs_btc_30d_pp: nearRet !== null && btcRet !== null ? nearRet - btcRet : null,
    near_beta_90d: beta, near_btc_corr_90d: corr,
    btc_close: btcLast.close, btc_wma: reg?.wma ?? null,
    btc_vs_wma_pct: reg ? pctChange(reg.close, reg.wma) : null,
    btc_weeks_below_wma: reg?.weeksBelow ?? null,
    btc_drawdown_pct: pctChange(btcLast.close, btcHigh),
  });

  labels.near_trend = slow === null || fast === null ? "no data" : close > slow && close > fast ? "above both averages" : close < slow && close < fast ? "below both averages" : "between the averages";
  labels.near_weekly_trend = weeklySma === null ? "no data" : (weekly.at(-1) as number) > weeklySma ? "above the weekly average" : "below the weekly average";
  labels.range_zone = position === null ? "no data" : position >= 50 ? "premium" : "discount";
  labels.fib_nearest = String(nearestFib.r);
  labels.btc_tripwire = reg?.state ?? "no data";

  const met: Record<(typeof CRITERIA)[number][0], boolean | null> = {
    above_slow: slow === null ? null : close > slow,
    above_fast: fast === null ? null : close > fast,
    weekly_up: weeklySma === null ? null : (weekly.at(-1) as number) > weeklySma,
    discount: position === null ? null : position < 50,
    npoc_near: lower[0] ? dist(lower[0].level) <= PARAMS.npoc_proximity_pct : false,
    rsi_ok: rsiNow === null ? null : rsiNow < 70,
    rs_positive: values.rs_vs_btc_30d_pp === null ? null : (values.rs_vs_btc_30d_pp as number) >= 0,
    regime_up: regime === null || regime === "no data" ? null : regime === "expansion",
  };
  const confluence = CRITERIA.map(([id, text]) => ({ id, text, met: met[id] }));
  const score = confluence.filter((c) => c.met === true).length;
  values.confluence_score = score;
  values.confluence_total = confluence.length;
  labels.technical_bias = score >= PARAMS.confluence_constructive_min ? "constructive" : score <= PARAMS.confluence_defensive_max ? "defensive" : "neutral";

  const entry = lower[0]?.level ?? null;
  if (entry === null) {
    labels.plan_status = "no open lower nPOC";
  } else {
    const stop = entry * (1 - PARAMS.stop_beyond_npoc_pct / 100);
    const t1 = range.median > entry ? range.median : (upper[0]?.level ?? range.high);
    const t2 = upper.find((n) => n.level > t1)?.level ?? range.high;
    const risk = (PARAMS.example_account_usd * PARAMS.risk_per_trade_pct) / 100;
    Object.assign(values, {
      plan_entry: entry, plan_stop: stop, plan_t1: t1, plan_t2: t2,
      plan_rr: (t1 - entry) / (entry - stop), plan_size_units: risk / (entry - stop), plan_risk_usd: risk,
    });
    labels.plan_status = "setup available";
  }
  return { values, labels, confluence, npocs: npoc.open, source: price.near.source };
}

export type AddMetric = (
  id: string, label: string, value: number | null, unit: MetricUnit, source: string, note?: string, provenance?: Metric["provenance"],
) => void;

export function registerTechnical(result: TechnicalResult, add: AddMetric, mode: "mock" | "live"): void {
  const source = result.source === "not available" ? "Price data (not available)" : `Price data · ${result.source}`;
  const provenance = result.source === "not available" ? undefined : mode === "mock" ? "simulated" : "computed";
  for (const [id, label, unit] of SPEC) {
    add(id, label, result.values[id] ?? null, unit, source, undefined, provenance);
  }
}
