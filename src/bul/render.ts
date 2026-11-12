import { PARAMS, type ParamId } from "./params";
import type { Metric } from "./types";

export type RenderContext = {
  metrics: Record<string, Metric>;
  labels: Record<string, { value: string }>;
  blocks: Record<string, string>;
};

const PLACEHOLDER = /\{\{(metric|param|label|block):([a-zA-Z0-9_]+)\}\}/g;
export const SENTINEL = "§";

const intFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const dec2 = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const usdFmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const signed = (s: string, n: number) => (n > 0 ? `+${s}` : s);

export function formatMetric(m: Metric): string {
  const v = m.value;
  if (v === null) return "no disponible";
  switch (m.unit) {
    case "count": return intFmt.format(v);
    case "pct": return `${dec1.format(v)} %`;
    case "pp": return `${signed(dec1.format(v), v)} pp`;
    case "usd": return usdFmt.format(v);
    case "corr": return dec2.format(v);
    case "days": return `${intFmt.format(v)} ${v === 1 ? "día" : "días"}`;
    case "index": return signed(dec2.format(v), v);
  }
}

export class MissingPlaceholderError extends Error {}

/**
 * Renders {{metric|param|label|block:id}}. In sentinel mode every value becomes "§",
 * which lets `verify` prove that no digit in the output came from hand-written text.
 */
export function render(template: string, ctx: RenderContext, sentinel = false): string {
  return template.replace(PLACEHOLDER, (_all, kind: string, id: string) => {
    if (kind === "block") {
      const block = ctx.blocks[id];
      if (block === undefined) throw new MissingPlaceholderError(`Unknown block: ${id}`);
      return render(block, ctx, sentinel);
    }
    if (kind === "metric") {
      const m = ctx.metrics[id];
      if (!m) throw new MissingPlaceholderError(`Unknown metric: ${id}`);
      return sentinel ? SENTINEL : formatMetric(m);
    }
    if (kind === "param") {
      if (!(id in PARAMS)) throw new MissingPlaceholderError(`Unknown param: ${id}`);
      return sentinel ? SENTINEL : String(PARAMS[id as ParamId]);
    }
    const l = ctx.labels[id];
    if (!l) throw new MissingPlaceholderError(`Unknown label: ${id}`);
    return sentinel ? SENTINEL : l.value;
  });
}

/** Digits allowed in literal text: the product name "1Click" and markdown section numbering. */
export function strayDigits(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^(#{1,6}\s+)\d+\.\s/, "$1").replace(/1Click/g, ""))
    .flatMap((line, i) => (/\d/.test(line) ? [`line ${i + 1}: ${line.trim().slice(0, 120)}`] : []));
}
