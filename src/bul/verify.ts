import { existsSync, readFileSync } from "node:fs";
import { loadEnv } from "../config/env";
import { createLogger } from "../lib/logger";
import { isMain, repoPath } from "../lib/paths";
import { buildCharts, type ChartDef } from "./charts";
import { buildContext } from "./evidence";
import { loadInputs } from "./load";
import { analyze } from "./metrics";
import { MissingPlaceholderError, render, strayDigits, type RenderContext } from "./render";

const log = createLogger("bul:verify");

export const TEMPLATE_PATH = repoPath("src/bul/thesis/THESIS.template.md");

export type Violation = { check: string; detail: string };

export function modeBanner(mode: "mock" | "live"): string {
  return mode === "mock"
    ? "> **SAMPLE THESIS · SIMULATED DATA.** On-chain, price and sentiment figures come from a seeded simulation and do not describe NEAR; they exercise the format and the logic of the pipeline. Desk notes are real but paraphrased, and external references are cited and unverified: each figure carries its own provenance label."
    : "> Real data. Reproducible with `pnpm bul:build` from the files in `data/`.";
}

/** The "never invent numbers" gate for the thesis and every chart sentence. */
export function verifyArtifacts(template: string, ctx: RenderContext, charts: readonly ChartDef[]): Violation[] {
  const violations: Violation[] = [];
  const check = (name: string, text: string) => {
    try {
      for (const d of strayDigits(render(text, ctx, true))) violations.push({ check: `${name}: number outside a placeholder`, detail: d });
    } catch (err) {
      if (err instanceof MissingPlaceholderError) violations.push({ check: `${name}: invalid placeholder`, detail: err.message });
      else throw err;
    }
  };
  check("THESIS", template);
  for (const c of charts) {
    if (!c.sentence.trim()) violations.push({ check: `chart ${c.id}`, detail: "missing plain sentence" });
    if (!c.query_file && !c.endpoint) violations.push({ check: `chart ${c.id}`, detail: "missing query and endpoint" });
    if (c.query_file && !existsSync(c.query_file)) violations.push({ check: `chart ${c.id}`, detail: `${c.query_file} does not exist` });
    check(`chart ${c.id}`, c.sentence);
  }
  for (const m of Object.values(ctx.metrics)) {
    if (m.value !== null && !Number.isFinite(m.value)) violations.push({ check: `metric ${m.id}`, detail: "non-finite value" });
  }
  return violations;
}

function main() {
  const env = loadEnv();
  const inputs = loadInputs(env.DATA_MODE);
  const analysis = analyze(inputs, inputs.manifest.generated_at);
  const ctx = buildContext(analysis);
  ctx.blocks.mode_banner = modeBanner(env.DATA_MODE);
  const violations = verifyArtifacts(readFileSync(TEMPLATE_PATH, "utf8"), ctx, buildCharts(inputs, analysis));
  if (violations.length) {
    log.error("verify failed", { violations });
    process.exitCode = 1;
    return;
  }
  log.info("verify passed", { mode: env.DATA_MODE });
  process.stdout.write(`verify: OK (${env.DATA_MODE})\n`);
}

if (isMain("src/bul/verify.ts")) main();
