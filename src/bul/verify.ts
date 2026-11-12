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
    ? "> **DATOS SIMULADOS.** Este documento se generó con el escenario mock: ninguna cifra describe a NEAR. Sirve solo para revisar el formato y la lógica del pipeline."
    : "> Datos reales. Reproducible con `pnpm bul:build` desde los archivos en `data/`.";
}

/** The "never invent numbers" gate for the thesis and every chart sentence. */
export function verifyArtifacts(template: string, ctx: RenderContext, charts: readonly ChartDef[]): Violation[] {
  const violations: Violation[] = [];
  const check = (name: string, text: string) => {
    try {
      for (const d of strayDigits(render(text, ctx, true))) violations.push({ check: `${name}: número fuera de placeholder`, detail: d });
    } catch (err) {
      if (err instanceof MissingPlaceholderError) violations.push({ check: `${name}: placeholder inválido`, detail: err.message });
      else throw err;
    }
  };
  check("THESIS", template);
  for (const c of charts) {
    if (!c.sentence.trim()) violations.push({ check: `chart ${c.id}`, detail: "sin frase descriptiva" });
    if (!c.query_file && !c.endpoint) violations.push({ check: `chart ${c.id}`, detail: "sin query ni endpoint" });
    if (c.query_file && !existsSync(c.query_file)) violations.push({ check: `chart ${c.id}`, detail: `no existe ${c.query_file}` });
    check(`chart ${c.id}`, c.sentence);
  }
  for (const m of Object.values(ctx.metrics)) {
    if (m.value !== null && !Number.isFinite(m.value)) violations.push({ check: `metric ${m.id}`, detail: "valor no finito" });
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
