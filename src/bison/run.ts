import { z } from "zod";
import { loadEnv, requireEnv } from "../config/env";
import { createLogger } from "../lib/logger";
import { dataRoot, writeJson } from "../lib/files";
import { BISON_DATASETS, datasetFile, type BisonDatasetId, type BisonManifest } from "../schemas/bison";
import { createBigQueryBackend, runGuarded, type QueryParams, type QueryTypes } from "./bq/client";
import { aggregateDaily, fetchSwaps, INTENTS_BASE_URL } from "./intents/client";

const log = createLogger("bison");

const DATE_TYPES: QueryTypes = { start_date: "DATE", end_date: "DATE" };

const BQ_JOBS: { id: Exclude<BisonDatasetId, "intents_daily">; extra?: (contract: string) => { params: QueryParams; types: QueryTypes } }[] = [
  { id: "daily_activity" },
  { id: "tx_status" },
  { id: "new_accounts" },
  { id: "contract_usage", extra: () => ({ params: { top_n: 20 }, types: { top_n: "INT64" } }) },
  { id: "contract_activity", extra: (c) => ({ params: { intents_contract: c }, types: { intents_contract: "STRING" } }) },
  { id: "concentration" },
  { id: "meta_tx" },
];

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** BigQuery returns INT64 as number or string depending on client options; normalize before validating. */
function normalize(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v]));
}

async function main() {
  const env = loadEnv();
  if (env.DATA_MODE !== "live") throw new Error("bison:fetch only runs with DATA_MODE=live; use `pnpm mock` for simulated data");
  const { GCP_PROJECT_ID, INTENTS_JWT } = requireEnv(env, ["GCP_PROJECT_ID", "GOOGLE_APPLICATION_CREDENTIALS", "INTENTS_JWT"]);
  const root = dataRoot("live");
  const end = new Date(`${isoDay(new Date())}T00:00:00Z`);
  const start = new Date(end.getTime() - env.BQ_WINDOW_DAYS * 86_400_000);
  const window = { start_date: isoDay(start), end_date: isoDay(end) };
  const backend = await createBigQueryBackend(GCP_PROJECT_ID);
  const items: BisonManifest["items"] = [];

  const freshStart = isoDay(new Date(end.getTime() - 365 * 86_400_000));
  const fresh = await runGuarded(backend, "freshness", { start_date: freshStart, end_date: window.end_date }, DATE_TYPES, env.BQ_MAX_BYTES);
  const lastBlockDate = z.object({ last_block_date: z.string().nullable() }).parse(fresh.rows[0] ?? { last_block_date: null }).last_block_date;
  log.info("freshness", { lastBlockDate });

  for (const job of BQ_JOBS) {
    const extra = job.extra?.(env.INTENTS_CONTRACT) ?? { params: {}, types: {} };
    const params = { ...window, ...extra.params };
    const res = await runGuarded(backend, job.id, params, { ...DATE_TYPES, ...extra.types }, env.BQ_MAX_BYTES);
    const rows = z.array(BISON_DATASETS[job.id]).parse(res.rows.map(normalize));
    const file = datasetFile(root, job.id);
    writeJson(file, { mode: "live", id: job.id, rows });
    items.push({
      id: job.id, file, source: "bigquery", query_file: `src/bison/bq/queries/${job.id}.sql`, endpoint: null,
      params, rows: rows.length, bytes_processed: res.bytesProcessed, fetched_at: new Date().toISOString(),
    });
  }

  const intentsStart = new Date(end.getTime() - env.INTENTS_WINDOW_DAYS * 86_400_000);
  const swaps = await fetchSwaps({ jwt: INTENTS_JWT, start: intentsStart, end });
  const daily = z.array(BISON_DATASETS.intents_daily).parse(aggregateDaily(swaps));
  const intentsFile = datasetFile(root, "intents_daily");
  writeJson(intentsFile, { mode: "live", id: "intents_daily", rows: daily });
  items.push({
    id: "intents_daily", file: intentsFile, source: "intents-explorer", query_file: null,
    endpoint: `${INTENTS_BASE_URL}/transactions?statuses=SUCCESS`,
    params: { start: isoDay(intentsStart), end: window.end_date, swaps: swaps.length },
    rows: daily.length, bytes_processed: null, fetched_at: new Date().toISOString(),
  });

  const manifest: BisonManifest = {
    mode: "live",
    generated_at: new Date().toISOString(),
    window: { start: window.start_date, end: window.end_date },
    freshness: { last_block_date: lastBlockDate, checked_at: new Date().toISOString() },
    items,
  };
  writeJson(`${root}/raw/manifest.json`, manifest);
  log.info("done", { items: items.length });
}

main().catch((err: unknown) => {
  log.error("bison failed", { error: err instanceof Error ? err.message : String(err) });
  process.exitCode = 1;
});
