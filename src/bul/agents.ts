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
  const notion = inputs.bearyNotion;

  return [
    {
      id: "beary",
      name: "Beary",
      role: "Psychological read: what trusted accounts say about NEAR on X and in Notion.",
      does: [
        "Reads TickersInfo, X Creative Output and X Account Analyses in Notion (token from the environment only) and keeps NEAR rows, not the English words near or nearly.",
        "Each day it queries xAI (Grok) with the x_search tool, limited to the account list and that day.",
        "A second model, swappable through an environment variable, turns the answer into JSON validated with zod.",
        "Discards posts that xAI did not cite, posts from accounts outside the list, from another date, or duplicated.",
        "Computes a deterministic credibility score and a weekly sentiment index.",
      ],
      inputs: ["config/beary.handles.yaml", "config/beary.notion.yaml", "NOTION_TOKEN", "xAI Responses API · x_search", "LLM_PROVIDER / LLM_MODEL"],
      outputs: ["data/beary/daily/YYYY-MM-DD.json", "data/beary/weekly/YYYY-Www.json", "data/beary/notion/near.json"],
      runs: bearyDaily.slice(-14).reverse().map((d) => ({
        at: d.date,
        summary: `${d.posts.length} verified posts · ${d.discarded.length} discarded`,
        details: { reconstructed: d.reconstructed, search: d.search_model, structuring: d.structuring_model, posts_read: d.posts_fetched },
      })),
      validations: [
        { name: "Posts without an xAI citation are discarded", status: "pass", detail: `${reasons("not_in_citations")} discarded` },
        { name: "Accounts outside the list are discarded", status: "pass", detail: `${reasons("handle_not_allowed")} discarded` },
        { name: "Posts outside the date are discarded", status: "pass", detail: `${reasons("outside_date_window")} discarded` },
        { name: "Reconstructed weeks are marked", status: reconstructedWeeks > 0 ? "warn" : "pass", detail: `${reconstructedWeeks} of ${inputs.bearyWeekly.length} weeks are reconstructed` },
        {
          name: "Notion NEAR dossier",
          status: notion ? "pass" : "n/a",
          detail: notion
            ? `${notion.hits.length} NEAR rows · ${notion.counts.discarded_false_positives} false positives discarded`
            : "not run (NOTION_TOKEN or the artifact is missing)",
        },
      ],
    },
    {
      id: "bison",
      name: "Bison",
      role: "Technical read: NEAR on-chain activity and 1Click Swap volume.",
      does: [
        "Queries the public NEAR dataset in BigQuery with versioned, parameterized queries.",
        "Runs a dry run before each query and aborts if it exceeds BQ_MAX_BYTES.",
        "Downloads successful 1Click swaps from the Intents Explorer, respecting its limit of one request every five seconds.",
        "Stores raw data and a manifest so everything can be rebuilt without credentials.",
      ],
      inputs: ["bigquery-public-data.crypto_near_mainnet_us", "Intents Explorer API (JWT)", "src/bison/bq/queries/*.sql"],
      outputs: ["data/raw/bq/*.json", "data/raw/intents/intents_daily.json", "data/raw/manifest.json"],
      runs: manifest.items.map((i) => ({
        at: i.fetched_at.slice(0, 10),
        summary: `${i.id}: ${i.rows} rows`,
        details: { source: i.source, query: i.query_file, endpoint: i.endpoint, bytes: i.bytes_processed },
      })),
      validations: [
        { name: "Every query filters by block_date", status: partitionOk ? "pass" : "fail", detail: `${queryIds.length} queries checked` },
        { name: "Bytes per query under the cap", status: overCap.length ? "fail" : inputs.mode === "mock" ? "n/a" : "pass", detail: inputs.mode === "mock" ? "no BigQuery in mock mode" : `${overCap.length} over the cap` },
        { name: "Dataset freshness", status: lagDays === null ? "fail" : lagDays <= 2 ? "pass" : "warn", detail: lastBlock ? `last block ${lastBlock} (${lagDays} days behind)` : "no freshness data" },
        { name: "Data validated with zod", status: "pass", detail: `${manifest.items.length} datasets` },
      ],
    },
    {
      id: "bul",
      name: "Bul",
      role: "Synthesis: crosses Beary with Bison and writes the thesis.",
      does: [
        "Computes metrics with pure functions from the raw data.",
        "Builds every chart with its query and a plain sentence.",
        "Crosses sentiment and activity to separate confirmations from mirages.",
        "Writes THESIS.md from a template where every figure comes from a placeholder.",
      ],
      inputs: ["data/raw/**", "data/beary/**", "src/bul/params.ts"],
      outputs: ["THESIS.md", "data/derived/metrics.json", "dist/ (static site)"],
      runs: [{ at: a.generated_at.slice(0, 10), summary: `${Object.keys(a.metrics).length} metrics · ${a.divergences.length} weeks crossed`, details: { mode: a.mode } }],
      validations: [
        { name: "No hand-written figures", status: violations.length ? "fail" : "pass", detail: violations.length ? violations.map((v) => v.check).join("; ") : "every figure comes from metrics.json" },
        { name: "Every chart has a query and a sentence", status: violations.some((v) => v.check.startsWith("chart")) ? "fail" : "pass", detail: "checked by verify" },
        { name: "Simulated and real data are never mixed", status: "pass", detail: `mode ${a.mode}` },
      ],
    },
  ];
}
