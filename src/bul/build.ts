import { readFileSync } from "node:fs";
import { loadEnv } from "../config/env";
import { createLogger } from "../lib/logger";
import { dataRoot, writeJson, writeText } from "../lib/files";
import { buildAgents } from "./agents";
import { buildCharts } from "./charts";
import { buildContext } from "./evidence";
import { loadInputs } from "./load";
import { analyze } from "./metrics";
import { render } from "./render";
import { modeBanner, TEMPLATE_PATH, verifyArtifacts } from "./verify";

const log = createLogger("bul");

/** One command: raw data → metrics → charts → THESIS.md → site bundle. Fails if any number is not backed by data. */
function main() {
  const env = loadEnv();
  const mode = env.DATA_MODE;
  const inputs = loadInputs(mode);
  const generatedAt = mode === "mock" ? inputs.manifest.generated_at : new Date().toISOString();
  const analysis = analyze(inputs, generatedAt);
  const ctx = buildContext(analysis);
  ctx.blocks.mode_banner = modeBanner(mode);
  const charts = buildCharts(inputs, analysis);
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  const violations = verifyArtifacts(template, ctx, charts);
  if (violations.length) {
    log.error("verify failed; nothing was written", { violations });
    throw new Error(`verify failed with ${violations.length} violations`);
  }

  const thesis = render(template, ctx);
  writeText(mode === "mock" ? "examples/THESIS.mock.md" : "THESIS.md", thesis);
  writeJson(`${dataRoot(mode)}/derived/metrics.json`, { mode, generated_at: generatedAt, metrics: analysis.metrics, labels: analysis.labels });

  const latest = inputs.bearyWeekly.at(-1);
  const latestPosts = latest
    ? inputs.bearyDaily.filter((d) => d.date >= latest.from && d.date < latest.to).flatMap((d) => d.posts).sort((x, y) => y.credibility - x.credibility).slice(0, 10)
    : [];
  const discardReasons: Record<string, number> = {};
  for (const d of inputs.bearyDaily) for (const x of d.discarded) discardReasons[x.reason] = (discardReasons[x.reason] ?? 0) + 1;

  writeJson("site/public/data/bundle.json", {
    mode,
    generated_at: generatedAt,
    thesis_md: thesis,
    hypothesis_verdict: analysis.labels.hypothesis_verdict?.value ?? null,
    regime: analysis.labels.regime?.value ?? null,
    metrics: analysis.metrics,
    charts: charts.map((c) => ({
      id: c.id, title: c.title, agent: c.agent, query_file: c.query_file, endpoint: c.endpoint,
      query_sql: c.query_file ? readFileSync(c.query_file, "utf8") : null,
      sentence: render(c.sentence, ctx), spec: c.spec,
    })),
    divergences: analysis.divergences,
    spikes: analysis.spikes,
    beary: { weeks: inputs.bearyWeekly, latest_posts: latestPosts, discard_reasons: discardReasons },
    agents: buildAgents(inputs, analysis, violations, env.BQ_MAX_BYTES),
  });
  log.info("build done", { mode, charts: charts.length });
  process.stdout.write(`bul:build OK (${mode}) · ${charts.length} gráficos · ${Object.keys(analysis.metrics).length} métricas\n`);
}

main();
