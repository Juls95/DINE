import { loadEnv } from "../../config/env";
import { createLogger } from "../../lib/logger";
import { dataRoot, writeJson } from "../../lib/files";
import { ingestFromEnv } from "./ingest";

const log = createLogger("beary:notion");

async function main() {
  const env = loadEnv();
  if (env.DATA_MODE !== "live") throw new Error("beary:notion only runs with DATA_MODE=live; use `pnpm mock` for simulated data");
  if (!env.NOTION_TOKEN) {
    log.warn("NOTION_TOKEN missing; skipping Notion ingest. Set it in .env or as a Render secret (sync: false).");
    process.stdout.write("beary:notion skipped (no NOTION_TOKEN)\n");
    return;
  }
  const snap = await ingestFromEnv({ env, token: env.NOTION_TOKEN });
  const path = `${dataRoot("live")}/beary/notion/near.json`;
  writeJson(path, snap);
  log.info("notion snapshot written", { path, hits: snap.hits.length, scanned: snap.counts.scanned_pages });
  process.stdout.write(`beary:notion OK · ${snap.hits.length} NEAR rows · ${snap.counts.scanned_pages} pages read\n`);
}

main().catch((err: unknown) => {
  log.error("beary notion failed", { error: err instanceof Error ? err.message : String(err) });
  process.exitCode = 1;
});
