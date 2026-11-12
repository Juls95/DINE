import { rmSync } from "node:fs";
import { createLogger } from "../lib/logger";
import { addDays, weekStart } from "../lib/dates";
import { dataRoot, writeJson } from "../lib/files";
import { isMain } from "../lib/paths";
import { buildWeekly } from "../beary/weekly";
import { datasetFile, type BisonDatasetId, type BisonManifest } from "../schemas/bison";
import type { Inputs, BisonData } from "../bul/load";
import { createRng } from "./prng";
import { mockBison } from "./bison";
import { mockBeary } from "./beary";

const log = createLogger("mock");

/** Fixed anchor so the simulated scenario (and its tests) never drift. */
export const MOCK_END = "2026-11-09";
const SEED = 20261109;

/** The whole simulated scenario in memory; `main` only persists it. */
export function buildMockInputs(root = dataRoot("mock")): Inputs {
  const rng = createRng(SEED);
  const { start, datasets } = mockBison(rng, MOCK_END, 180, 90);
  const items: BisonManifest["items"] = (Object.entries(datasets) as [BisonDatasetId, unknown[]][]).map(([id, rows]) => ({
    id, file: datasetFile(root, id), source: "mock",
    query_file: id === "intents_daily" ? null : `src/bison/bq/queries/${id}.sql`,
    endpoint: id === "intents_daily" ? "mock://intents-explorer/transactions" : null,
    params: { start_date: start, end_date: MOCK_END }, rows: rows.length, bytes_processed: null,
    fetched_at: `${MOCK_END}T06:00:00.000Z`,
  }));
  const manifest: BisonManifest = {
    mode: "mock", generated_at: `${MOCK_END}T06:00:00.000Z`, window: { start, end: MOCK_END },
    freshness: { last_block_date: addDays(MOCK_END, -1), checked_at: `${MOCK_END}T06:00:00.000Z` }, items,
  };
  const bearyDaily = mockBeary(rng, MOCK_END, 5, addDays(MOCK_END, -7));
  const bearyWeekly = [...new Set(bearyDaily.map((d) => weekStart(d.date)))].map((monday) => buildWeekly(bearyDaily, monday));
  return { mode: "mock", manifest, bison: datasets as BisonData, bearyDaily, bearyWeekly };
}

function main() {
  const root = dataRoot("mock");
  rmSync(root, { recursive: true, force: true });
  const inputs = buildMockInputs(root);
  for (const item of inputs.manifest.items) {
    writeJson(item.file, { mode: "mock", id: item.id, rows: inputs.bison[item.id as BisonDatasetId] });
  }
  writeJson(`${root}/raw/manifest.json`, inputs.manifest);
  for (const d of inputs.bearyDaily) writeJson(`${root}/beary/daily/${d.date}.json`, d);
  for (const w of inputs.bearyWeekly) writeJson(`${root}/beary/weekly/${w.week}.json`, w);
  log.info("mock data written", { root, days: inputs.bearyDaily.length });
}

if (isMain("src/mock/run.ts")) main();
