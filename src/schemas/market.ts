import { z } from "zod";
import { DataMode, IsoDate } from "./common";

export const MetricUnit = z.enum(["count", "pct", "pp", "usd", "usd2", "corr", "days", "index", "ratio"]);
export type MetricUnit = z.infer<typeof MetricUnit>;

/** One daily candle. Prices are in USD; rows must be strictly ascending by date. */
export const PriceBar = z
  .object({
    date: IsoDate,
    open: z.number().positive(),
    high: z.number().positive(),
    low: z.number().positive(),
    close: z.number().positive(),
    volume: z.number().nonnegative(),
  })
  .refine((b) => b.high >= Math.max(b.open, b.close, b.low) && b.low <= Math.min(b.open, b.close), {
    message: "inconsistent OHLC bar",
  });
export type PriceBar = z.infer<typeof PriceBar>;

export const PriceSeries = z
  .object({
    mode: DataMode,
    symbol: z.enum(["NEAR", "BTC"]),
    /** Where the candles come from. Live runs must name an approved source; mock runs say so. */
    source: z.string().min(1),
    generated_at: z.string().min(1),
    bars: z.array(PriceBar).min(2),
  })
  .superRefine((s, ctx) => {
    for (let i = 1; i < s.bars.length; i++) {
      if ((s.bars[i] as PriceBar).date <= (s.bars[i - 1] as PriceBar).date) {
        ctx.addIssue({ code: "custom", message: `bars must be strictly ascending (index ${i})` });
        return;
      }
    }
  });
export type PriceSeries = z.infer<typeof PriceSeries>;

/** A number quoted by a trading desk in a Notion row. It is a claim by the desk, never a measurement. */
export const DeskFigure = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  label: z.string().min(1),
  value: z.number().finite(),
  unit: MetricUnit,
  as_of: IsoDate.nullable(),
  note: z.string().optional(),
});
export type DeskFigure = z.infer<typeof DeskFigure>;

export const DeskTopic = z.enum(["setup", "positioning", "exploit", "partnership", "price", "macro"]);

/**
 * A paraphrased desk claim. `claim` may only quote figures through {{metric:desk_<id>}} placeholders so that
 * the thesis verifier can prove no number is typed by hand.
 */
export const DeskObservation = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  date: IsoDate.nullable(),
  desk: z.string().min(1),
  topic: DeskTopic,
  claim: z.string().min(1).max(600),
});
export type DeskObservation = z.infer<typeof DeskObservation>;

export const DeskSnapshot = z.object({
  mode: DataMode,
  generated_at: z.string().min(1),
  source: z.literal("notion"),
  /** Public X accounts whose rows mention NEAR. */
  desks: z.array(z.string().min(1)),
  figures: z.array(DeskFigure),
  observations: z.array(DeskObservation),
});
export type DeskSnapshot = z.infer<typeof DeskSnapshot>;
