import { z } from "zod";
import type { AgentCard } from "../../../src/bul/agents";
import type { Divergence, Metric, SpikeEvent } from "../../../src/bul/types";
import type { BearyWeekly, ScoredPost } from "../../../src/schemas/beary";

export type ChartView = {
  id: string;
  title: string;
  agent: "bison" | "beary" | "bul";
  query_file: string | null;
  endpoint: string | null;
  query_sql: string | null;
  sentence: string;
  spec: Record<string, unknown>;
};

export type Bundle = {
  mode: "mock" | "live";
  generated_at: string;
  thesis_md: string;
  hypothesis_verdict: string | null;
  regime: string | null;
  metrics: Record<string, Metric>;
  charts: ChartView[];
  divergences: Divergence[];
  spikes: SpikeEvent[];
  beary: { weeks: BearyWeekly[]; latest_posts: ScoredPost[]; discard_reasons: Record<string, number> };
  agents: AgentCard[];
};

/** Shallow runtime check: fail fast if the bundle is missing or from an incompatible build. */
const BundleShape = z.looseObject({
  mode: z.enum(["mock", "live"]),
  generated_at: z.string(),
  thesis_md: z.string(),
  charts: z.array(z.looseObject({ id: z.string(), spec: z.record(z.string(), z.unknown()) })),
  agents: z.array(z.looseObject({ id: z.enum(["beary", "bison", "bul"]) })).length(3),
});

export function parseBundle(json: unknown): Bundle {
  const res = BundleShape.safeParse(json);
  if (!res.success) throw new Error(`bundle.json inválido: ${res.error.issues[0]?.message ?? "forma desconocida"}`);
  return json as Bundle;
}

export async function loadBundle(fetchImpl: typeof fetch = fetch): Promise<Bundle> {
  const res = await fetchImpl("./data/bundle.json");
  if (!res.ok) throw new Error(`No se pudo cargar data/bundle.json (${res.status}). Corre \`pnpm bul:build\`.`);
  return parseBundle(await res.json());
}
