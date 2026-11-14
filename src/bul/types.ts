import type { DataMode } from "../schemas/common";
import type { DeskObservation, MetricUnit } from "../schemas/market";

export type { MetricUnit };

/** Where a number comes from. Shown next to every figure so readers know what they can verify. */
export type Provenance = "computed" | "simulated" | "desk" | "cited";

export type Metric = {
  id: string;
  label: string;
  value: number | null;
  unit: MetricUnit;
  source: string;
  provenance?: Provenance;
  note?: string;
};

export type Label = { id: string; value: string };

export type SpikeEvent = { date: string; multiple: number; top10_share_pct: number; classification: "spike" | "structural_change" };

export type Divergence = {
  week: string;
  from: string;
  reconstructed: boolean;
  sentiment_index: number | null;
  sentiment_delta: number | null;
  onchain_change_pct: number | null;
  quadrant: "confirmation" | "mirage" | "unnarrated opportunity" | "confirmed deterioration" | "neutral" | "no data";
};

export type LagPoint = { lag: number; forward: number | null; reverse: number | null; n: number };

export type ConfluenceItem = { id: string; text: string; met: boolean | null };
export type Npoc = { created: string; level: number; side: "upper" | "lower" };

export type Analysis = {
  mode: DataMode;
  generated_at: string;
  last_block_date: string | null;
  window: { start: string; end: string };
  metrics: Record<string, Metric>;
  labels: Record<string, Label>;
  spikes: SpikeEvent[];
  divergences: Divergence[];
  lag: LagPoint[];
  confluence: ConfluenceItem[];
  npocs: Npoc[];
  notion_themes: { id: string; title: string; count: number }[];
  desk_observations: DeskObservation[];
};
