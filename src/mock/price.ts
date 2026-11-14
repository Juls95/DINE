import { addDays } from "../lib/dates";
import type { PriceBar } from "../schemas/market";
import { DESK_ANCHORS } from "./desk";
import { createRng, type Rng } from "./prng";

/** Box-Muller normal draw from the seeded generator, so the simulation is identical on every run. */
function gauss(rng: Rng): number {
  const u = Math.max(rng.next(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng.next());
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** Pins a close series to quoted prices: the log residual is interpolated linearly between pins and held flat outside. */
function pin(closes: readonly number[], pins: readonly { index: number; target: number }[]): number[] {
  const res = pins.map((p) => ({ index: p.index, r: Math.log(p.target / (closes[p.index] as number)) }));
  return closes.map((c, i) => {
    const first = res[0] as { index: number; r: number };
    const last = res[res.length - 1] as { index: number; r: number };
    let r: number;
    if (i <= first.index) r = first.r;
    else if (i >= last.index) r = last.r;
    else {
      const k = res.findIndex((x) => x.index >= i);
      const a = res[k - 1] as { index: number; r: number };
      const b = res[k] as { index: number; r: number };
      r = a.r + ((b.r - a.r) * (i - a.index)) / (b.index - a.index);
    }
    return c * Math.exp(r);
  });
}

export type PriceScenario = { drift: number; lateDrift: number; reversion: number; idioReversion: number; shocks: [number, number][]; recoveryDrift: number };

/**
 * Seeded daily candles for BTC and NEAR. NEAR follows BTC with a designed beta plus idiosyncratic noise and a few
 * fast, body-dominated candles (they leave nPOC prints). Closes are pinned to prices quoted in the author's Notion
 * notes (two per symbol); everything else is simulated, and the series say so in `source`.
 */
export function mockPrice(seed: number, endExclusive: string, days: number, generatedAt: string, sc: PriceScenario = SCENARIO) {
  const rng = createRng(seed);
  const dates = Array.from({ length: days }, (_, i) => addDays(endExclusive, -(days - i)));
  const idx = (date: string) => {
    const i = dates.indexOf(date);
    if (i < 0) throw new Error(`Anchor date ${date} is outside the simulated price window`);
    return i;
  };
  const shocks = new Map<number, number>(sc.shocks.map(([back, v]) => [days - back, v]));
  const btcRaw: number[] = [];
  const nearRaw: number[] = [];
  // Mean-reverting log prices: BTC drifts inside a wide range, NEAR is a levered copy plus its own mean-reverting noise.
  const muB = Math.log(76_000);
  let b = muB;
  let z = 0;
  const lateFrom = idx(DESK_ANCHORS.btcPrint.date);
  for (let i = 0; i < days; i++) {
    const rb = sc.reversion * (muB - b) + (i < lateFrom ? sc.drift : sc.lateDrift) + 0.018 * gauss(rng);
    b += rb;
    z = z * (1 - sc.idioReversion) + 0.016 * gauss(rng) + (shocks.get(i) ?? 0) + (i > days - 17 ? sc.recoveryDrift : 0);
    btcRaw.push(Math.exp(b));
    nearRaw.push(Math.exp(Math.log(4.6) + 1.6 * (b - muB) + z));
  }
  const nearClose = pin(nearRaw, DESK_ANCHORS.nearPins.map((p) => ({ index: idx(p.date), target: p.close })));
  const btcClose = pin(btcRaw, DESK_ANCHORS.btcPins.map((p) => ({ index: idx(p.date), target: p.close })));

  const candles = (closes: readonly number[], impulses: ReadonlySet<number>, digits: number): PriceBar[] =>
    closes.map((c, i) => {
      const prev = closes[i - 1] ?? c;
      const open = i === 0 ? prev : prev * (1 + 0.003 * gauss(rng));
      const impulse = impulses.has(i);
      const wick = impulse ? 0.002 : Math.abs(0.012 * gauss(rng)) + 0.003;
      const high = Math.max(open, c) * (1 + wick * (impulse ? 1 : 1 + rng.next()));
      const low = Math.min(open, c) * (1 - wick * (impulse ? 1 : 1 + rng.next()));
      const move = Math.abs(Math.log(c / open));
      const volume = 1_000_000 * Math.exp(0.35 * gauss(rng)) * (1 + 12 * move);
      return {
        date: dates[i] as string,
        open: round(open, digits), high: round(high, digits), low: round(low, digits), close: round(c, digits),
        volume: Math.round(volume),
      };
    });

  const common = { mode: "mock" as const, generated_at: generatedAt };
  const source = "simulated candles (seeded); two closes pinned to Notion price prints";
  return {
    near: { ...common, symbol: "NEAR" as const, source, bars: candles(nearClose, new Set(shocks.keys()), 4) },
    btc: { ...common, symbol: "BTC" as const, source, bars: candles(btcClose, new Set<number>(), 2) },
  };
}

/** Days back from the end (exclusive) at which NEAR gets a fast candle; chosen so the sample leaves nPOC prints. */
export const SCENARIO: PriceScenario = {
  drift: 0,
  lateDrift: -0.0007,
  reversion: 0.02,
  idioReversion: 0.04,
  shocks: [[75, -0.11], [58, 0.14], [44, -0.12], [31, 0.13], [17, 0.09]],
  recoveryDrift: 0.003,
};
