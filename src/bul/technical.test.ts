import { addDays } from "../lib/dates";
import { PriceBar, PriceSeries, DeskFigure } from "../schemas/market";
import { buildMockInputs, MOCK_END } from "../mock/run";
import { PARAMS } from "./params";
import { betaToBtc, btcRegime, computeTechnical, findNpocs, rangeFramework, rsi, sma, weeklyCloses } from "./technical";
import type { PriceData } from "./technical";

const START = "2026-01-01";
const bar = (i: number, open: number, close: number, wick = 0.1): PriceBar => ({
  date: addDays(START, i), open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick, volume: 1000,
});

/** Calm, slightly oscillating candles around 100 followed by whatever the test appends. */
function calm(n: number): PriceBar[] {
  return Array.from({ length: n }, (_, i) => bar(i, 100 + (i % 2) * 0.4, 100.2 + (i % 2) * 0.2, 0.3));
}

const OPTS = { atrDays: 14, impulseAtr: 2, bodySharePct: 60 };

/** Slow grind: n small candles walking the close from `from` to `to`, none of them fast enough to leave a print. */
function grind(startIndex: number, from: number, to: number, n: number): PriceBar[] {
  return Array.from({ length: n }, (_, k) => bar(startIndex + k, from + ((to - from) * k) / n, from + ((to - from) * (k + 1)) / n, 0.1));
}

describe("indicators", () => {
  it("sma needs a full window and averages the tail", () => {
    expect(sma([1, 2, 3], 5)).toBeNull();
    expect(sma([1, 2, 3, 4], 2)).toBe(3.5);
  });

  it("rsi is 100 on a pure uptrend and low on a pure downtrend", () => {
    const up = Array.from({ length: 30 }, (_, i) => 100 + i);
    const down = Array.from({ length: 30 }, (_, i) => 100 - i);
    expect(rsi(up, 14)).toBe(100);
    expect(rsi(down, 14)).toBeLessThan(1);
    expect(rsi([1, 2], 14)).toBeNull();
  });

  it("range framework derives median and Fibonacci levels from the lookback only", () => {
    const bars = [bar(0, 50, 60), bar(1, 100, 110), bar(2, 105, 95)];
    const r = rangeFramework(bars, 2);
    expect(r.high).toBeCloseTo(110.1);
    expect(r.low).toBeCloseTo(94.9);
    expect(r.median).toBeCloseTo(102.5);
    expect(r.fib[0.5]).toBeCloseTo(r.median);
    expect(r.fib[0.618]).toBeCloseTo(r.low + 0.618 * (r.high - r.low));
  });

  it("weekly closes keep the last close of each Monday-based week", () => {
    const bars = Array.from({ length: 14 }, (_, i) => bar(i, 10 + i, 10 + i));
    expect(weeklyCloses(bars)).toHaveLength(3);
  });
});

describe("nPOC", () => {
  it("a fast candle leaves an open level in the middle of its body until a candle closes through it", () => {
    const bars = [...calm(20), bar(20, 100, 112, 0.1), bar(21, 112, 113, 0.3)];
    const { open, created } = findNpocs(bars, OPTS);
    expect(created).toHaveLength(1);
    expect(open).toHaveLength(1);
    expect(open[0]?.level).toBeCloseTo(106);
    expect(open[0]?.side).toBe("lower");
  });

  it("a wick through the level does not close it, a close does", () => {
    const wick = [...calm(20), bar(20, 100, 112, 0.1), { ...bar(21, 112, 112.5, 0.1), low: 104 }];
    expect(findNpocs(wick, OPTS).open).toHaveLength(1);
    const closed = [...wick, ...grind(22, 112.5, 105.5, 10)];
    const result = findNpocs(closed, OPTS);
    expect(result.created).toHaveLength(1);
    expect(result.open).toHaveLength(0);
  });

  it("a fast drop leaves an upper level that a later close at or above clears", () => {
    const drop = [...calm(20), bar(20, 100, 88, 0.1), bar(21, 88, 87, 0.3)];
    const open = findNpocs(drop, OPTS).open;
    expect(open[0]?.side).toBe("upper");
    expect(open[0]?.level).toBeCloseTo(94);
    const cleared = findNpocs([...drop, ...grind(22, 87, 94.5, 10)], OPTS);
    expect(cleared.created).toHaveLength(1);
    expect(cleared.open).toHaveLength(0);
  });

  it("ignores wide candles that are mostly wick", () => {
    const wicky = [...calm(20), { ...bar(20, 100, 101, 0.1), high: 112, low: 99.9 }];
    expect(findNpocs(wicky, OPTS).created).toHaveLength(0);
  });
});

describe("beta and BTC regime", () => {
  it("recovers an exact beta of two when NEAR doubles every BTC move", () => {
    const btcCloses = [100];
    const nearCloses = [10];
    for (let i = 1; i < 60; i++) {
      const r = Math.sin(i) * 0.02;
      btcCloses.push((btcCloses[i - 1] as number) * Math.exp(r));
      nearCloses.push((nearCloses[i - 1] as number) * Math.exp(2 * r));
    }
    const mk = (cs: number[]) => cs.map((c, i) => bar(i, c, c, 0));
    const { beta, corr } = betaToBtc(mk(nearCloses), mk(btcCloses), 50);
    expect(beta).toBeCloseTo(2, 5);
    expect(corr).toBeCloseTo(1, 5);
  });

  it("counts consecutive weekly closes below the weekly average and maps them to a tripwire state", () => {
    const base = Array.from({ length: 50 }, () => 100);
    expect(btcRegime([...base, 101], 50, 4)?.state).toBe("intact");
    expect(btcRegime([...base, 90], 50, 4)).toMatchObject({ weeksBelow: 1, state: "breached, regain window open" });
    expect(btcRegime([...base, 90, 89, 88, 87], 50, 4)).toMatchObject({ weeksBelow: 4, state: "triggered" });
    expect(btcRegime([1, 2, 3], 50, 4)).toBeNull();
  });
});

describe("computeTechnical", () => {
  const inputs = buildMockInputs();
  const price = inputs.price as PriceData;

  it("reports everything as not available when there is no price source", () => {
    const t = computeTechnical(null, "expansion");
    expect(Object.values(t.values).filter((v) => v !== null)).toEqual([PARAMS.example_account_usd]);
    expect(t.labels.technical_bias).toBe("no data");
    expect(t.confluence.every((c) => c.met === null)).toBe(true);
  });

  it("pins the simulated candles to the prices quoted in the Notion notes", () => {
    const at = (symbol: "near" | "btc", date: string) => price[symbol].bars.find((b) => b.date === date)?.close;
    expect(at("near", "2026-10-25")).toBeCloseTo(4.45, 2);
    expect(at("near", "2026-10-15")).toBeCloseTo(4.6, 2);
    expect(at("btc", "2026-11-11")).toBeCloseTo(71_500, 0);
    expect(at("btc", "2026-11-01")).toBeCloseTo(77_600, 0);
    expect(price.near.source).toMatch(/simulated/);
    expect(price.near.bars.at(-1)?.date).toBe(addDays(MOCK_END, -1));
  });

  it("builds a risk template whose arithmetic follows the framework formulas", () => {
    const t = computeTechnical(price, "expansion");
    const v = t.values as Record<string, number>;
    expect(t.labels.plan_status).toBe("setup available");
    expect(v.plan_stop).toBeCloseTo((v.plan_entry as number) * (1 - PARAMS.stop_beyond_npoc_pct / 100), 6);
    expect(v.plan_risk_usd).toBeCloseTo((PARAMS.example_account_usd * PARAMS.risk_per_trade_pct) / 100, 6);
    expect(v.plan_size_units).toBeCloseTo((v.plan_risk_usd as number) / ((v.plan_entry as number) - (v.plan_stop as number)), 6);
    expect(v.plan_rr).toBeCloseTo(((v.plan_t1 as number) - (v.plan_entry as number)) / ((v.plan_entry as number) - (v.plan_stop as number)), 6);
  });

  it("derives the bias from the pre-registered thresholds", () => {
    const t = computeTechnical(price, "expansion");
    const score = t.confluence.filter((c) => c.met === true).length;
    expect(t.values.confluence_score).toBe(score);
    expect(t.values.confluence_total).toBe(t.confluence.length);
    const expected = score >= PARAMS.confluence_constructive_min ? "constructive" : score <= PARAMS.confluence_defensive_max ? "defensive" : "neutral";
    expect(t.labels.technical_bias).toBe(expected);
  });

  it("is deterministic: the same seed gives the same candles", () => {
    expect(buildMockInputs().price).toEqual(price);
  });
});

describe("market schemas", () => {
  it("rejects inconsistent candles and unordered series", () => {
    expect(PriceBar.safeParse({ date: "2026-01-01", open: 10, high: 9, low: 8, close: 9, volume: 1 }).success).toBe(false);
    const good = { date: "2026-01-01", open: 10, high: 11, low: 9, close: 10, volume: 1 };
    const series = { mode: "mock", symbol: "NEAR", source: "t", generated_at: "x", bars: [good, { ...good, date: "2026-01-01" }] };
    expect(PriceSeries.safeParse(series).success).toBe(false);
    expect(PriceSeries.safeParse({ ...series, bars: [good, { ...good, date: "2026-01-02" }] }).success).toBe(true);
  });

  it("only accepts machine-safe figure ids", () => {
    expect(DeskFigure.safeParse({ id: "Bad Id", label: "x", value: 1, unit: "usd", as_of: null }).success).toBe(false);
    expect(DeskFigure.safeParse({ id: "ok_id", label: "x", value: 1, unit: "usd", as_of: null }).success).toBe(true);
  });
});
