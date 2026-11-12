import { existsSync, readFileSync, readdirSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { loadEnv, requireEnv } from "../config/env";
import { createLlmClient } from "../llm";
import { citationUrls, outputText, xSearch } from "../llm/xai";
import { createLogger } from "../lib/logger";
import { addDays, isoDay, weekStart } from "../lib/dates";
import { dataRoot, readJson, writeJson } from "../lib/files";
import { BearyDaily, HandleConfig, type HandleTier } from "../schemas/beary";
import { structureAnswer, verifyPosts } from "./extract";
import { scorePosts } from "./score";
import { buildWeekly } from "./weekly";

const log = createLogger("beary");
const HANDLES_FILE = "config/beary.handles.yaml";

export const SEARCH_PROMPT = (date: string) =>
  `List every post these accounts published on ${date} (UTC) about NEAR Protocol, NEAR Intents, NEAR AI or the NEAR ecosystem. ` +
  `For each post give its URL, the author handle, a one-sentence neutral summary, whether it links to a primary source, ` +
  `and whether it states a figure. Do not include posts from other dates or other accounts.`;

function chunk<T>(xs: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

function parseArgs(argv: readonly string[]) {
  const idx = argv.indexOf("--backfill-weeks");
  const backfillWeeks = idx >= 0 ? Number(argv[idx + 1] ?? 0) : 0;
  const dateIdx = argv.indexOf("--date");
  return { backfillWeeks, date: dateIdx >= 0 ? argv[dateIdx + 1] : undefined };
}

async function main() {
  const env = loadEnv();
  if (env.DATA_MODE !== "live") throw new Error("beary:run only runs with DATA_MODE=live; use `pnpm mock` for simulated data");
  const { XAI_API_KEY } = requireEnv(env, ["XAI_API_KEY"]);
  if (!existsSync(HANDLES_FILE)) throw new Error(`Missing ${HANDLES_FILE}. Copy config/beary.handles.example.yaml and add the accounts to follow.`);
  const config = HandleConfig.parse(parseYaml(readFileSync(HANDLES_FILE, "utf8")));
  const tiers = new Map<string, HandleTier>(config.handles.map((h) => [h.handle.toLowerCase(), h.tier]));
  const llm = createLlmClient(env);
  const root = dataRoot("live");

  const { backfillWeeks, date } = parseArgs(process.argv);
  const yesterday = addDays(isoDay(new Date()), -1);
  const lastDay = date ?? yesterday;
  const firstDay = backfillWeeks > 0 ? weekStart(addDays(lastDay, -7 * backfillWeeks)) : lastDay;
  const liveDay = yesterday;

  for (let day = firstDay; day <= lastDay; day = addDays(day, 1)) {
    const allPosts: unknown[] = [];
    const citations = new Set<string>();
    let fetched = 0;
    for (const batch of chunk(config.handles.map((h) => h.handle), 20)) {
      const res = await xSearch({
        apiKey: XAI_API_KEY, model: env.XAI_MODEL, maxTurns: env.XAI_MAX_TURNS,
        prompt: SEARCH_PROMPT(day), handles: batch, fromDate: day, toDate: addDays(day, 1),
      });
      const urls = citationUrls(res);
      urls.forEach((u) => citations.add(u));
      fetched += res.usage?.server_side_tool_usage_details?.x_posts_fetched ?? 0;
      allPosts.push(...(await structureAnswer(llm, outputText(res), [...urls], day)));
    }
    const { kept, discarded } = verifyPosts({ posts: allPosts, citations, allowedHandles: new Set(tiers.keys()), date: day });
    const daily = BearyDaily.parse({
      mode: "live", date: day, reconstructed: day < liveDay,
      search_model: env.XAI_MODEL, structuring_model: `${llm.provider}:${llm.model}`,
      posts_fetched: fetched, posts: scorePosts(kept, tiers), discarded,
    });
    writeJson(`${root}/beary/daily/${day}.json`, daily);
    log.info("day done", { day, kept: kept.length, discarded: discarded.length, fetched });
  }

  const dailyDir = `${root}/beary/daily`;
  const days = readdirSync(dailyDir).filter((f) => f.endsWith(".json")).map((f) => readJson(`${dailyDir}/${f}`, BearyDaily));
  const weeks = new Set(days.map((d) => weekStart(d.date)));
  for (const monday of weeks) {
    const weekly = buildWeekly(days, monday);
    writeJson(`${root}/beary/weekly/${weekly.week}.json`, weekly);
  }
}

main().catch((err: unknown) => {
  log.error("beary failed", { error: err instanceof Error ? err.message : String(err) });
  process.exitCode = 1;
});
