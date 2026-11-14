import { readFileSync } from "node:fs";
import { buildMockInputs, MOCK_END } from "../mock/run";
import { buildCharts } from "./charts";
import { buildContext } from "./evidence";
import { analyze, classifySpikes } from "./metrics";
import { formatMetric, MissingPlaceholderError, render, strayDigits, type RenderContext } from "./render";
import { modeBanner, TEMPLATE_PATH, verifyArtifacts } from "./verify";

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("expected a value in the mock scenario");
  return value;
}

const ctx: RenderContext = {
  metrics: { a: { id: "a", label: "A", value: 12.345, unit: "pct", source: "test" } },
  labels: { regime: { value: "expansion" } },
  blocks: { inner: "value {{metric:a}}" },
};

describe("render", () => {
  it("formats metrics in en-US and resolves nested blocks", () => {
    expect(render("{{block:inner}} · {{label:regime}} · {{param:lag_min_r}}", ctx)).toBe("value 12.3% · expansion · 0.3");
  });

  it("throws on unknown placeholders", () => {
    expect(() => render("{{metric:nope}}", ctx)).toThrow(MissingPlaceholderError);
  });

  it("says 'not available' instead of inventing a value", () => {
    expect(formatMetric({ id: "x", label: "x", value: null, unit: "count", source: "t" })).toBe("not available");
  });

  it("strayDigits allows only 1Click and section numbers", () => {
    expect(strayDigits("## 3. Pilares\n1Click crece")).toEqual([]);
    expect(strayDigits("crece 40 %")).toHaveLength(1);
  });
});

describe("mock scenario end to end", () => {
  const inputs = buildMockInputs("data/mock");
  const analysis = analyze(inputs, `${MOCK_END}T06:00:00.000Z`);

  it("the template and every chart sentence pass the 'never invent numbers' gate", () => {
    const c = buildContext(analysis);
    c.blocks.mode_banner = modeBanner("mock");
    expect(verifyArtifacts(readFileSync(TEMPLATE_PATH, "utf8"), c, buildCharts(inputs, analysis))).toEqual([]);
  });

  it("flags a literal number written into a sentence", () => {
    const c = buildContext(analysis);
    c.blocks.mode_banner = modeBanner("mock");
    const charts = buildCharts(inputs, analysis).map((ch, i) => (i === 0 ? { ...ch, sentence: "It grew 40 % this week." } : ch));
    expect(verifyArtifacts("# Thesis", c, charts).some((v) => v.check.includes("number outside a placeholder"))).toBe(true);
  });

  it("classifies the concentrated mock airdrop as a spike, not adoption", () => {
    const spikes = classifySpikes(inputs);
    expect(spikes.length).toBeGreaterThan(0);
    expect(spikes.every((s) => s.classification === "spike")).toBe(true);
  });

  it("finds the designed 1Click lead and the mirage week", () => {
    expect(analysis.labels.lead_status?.value).toBe("observed");
    expect(analysis.divergences.some((d) => d.quadrant === "mirage")).toBe(true);
  });

  it("labels every Beary week as live or reconstructed", () => {
    expect(analysis.divergences.filter((d) => !d.reconstructed)).toHaveLength(1);
  });
});

describe("provenance and desk layer", () => {
  const inputs = buildMockInputs("data/mock");
  const at = `${MOCK_END}T06:00:00.000Z`;
  const analysis = analyze(inputs, at);
  const prov = (id: string) => analysis.metrics[id]?.provenance;

  it("renders the provenance word of a metric and hides it behind the sentinel in verification mode", () => {
    const c: RenderContext = { ...ctx, metrics: { a: { ...must(ctx.metrics.a), provenance: "desk" } } };
    expect(render("{{prov:a}}", c)).toBe("desk");
    expect(() => render("{{prov:nope}}", c)).toThrow(MissingPlaceholderError);
  });

  it("never labels simulated pipeline inputs as computed, and keeps desk and cited figures apart", () => {
    expect(prov("desk_whale_pnl_oct_usd")).toBe("desk");
    expect(prov("notion_rows_total")).toBe("desk");
    expect(prov("desk_count")).toBe("desk");
    const cited = Object.values(analysis.metrics).filter((m) => m.provenance === "cited");
    expect(cited.length).toBeGreaterThan(0);
    expect(cited.every((m) => m.id.startsWith("ref_"))).toBe(true);
    const simulated = Object.values(analysis.metrics).filter((m) => m.provenance === "simulated");
    expect(simulated.length).toBeGreaterThan(0);
    expect(Object.values(analysis.metrics).some((m) => m.provenance === "computed")).toBe(false);
  });

  it("derives the selloff beta only from the two quoted moves", () => {
    const near = analysis.metrics.desk_near_move_oct25_pct?.value as number;
    const btc = analysis.metrics.desk_btc_move_oct25_pct?.value as number;
    expect(analysis.metrics.desk_alt_beta_ratio?.value).toBeCloseTo(near / btc, 6);
  });

  it("without desk, Notion or price data every dependent metric is null and the build still verifies", () => {
    const bare = { ...inputs, desk: null, bearyNotion: null, price: null };
    const a = analyze(bare, at);
    expect(a.metrics.desk_whale_pnl_oct_usd?.value).toBeNull();
    expect(a.metrics.notion_rows_total?.value).toBeNull();
    expect(a.metrics.near_rsi?.value).toBeNull();
    expect(analysis.metrics.near_rsi?.value).not.toBeNull();
    const c = buildContext(a);
    c.blocks.mode_banner = modeBanner("mock");
    expect(verifyArtifacts(readFileSync(TEMPLATE_PATH, "utf8"), c, buildCharts(bare, a))).toEqual([]);
  });

  it("a number typed into a desk claim is caught by the gate", () => {
    const desk = must(inputs.desk);
    const tampered = { ...desk, observations: desk.observations.map((o, i) => (i === 0 ? { ...o, claim: `${o.claim} It fell 12 percent.` } : o)) };
    const a = analyze({ ...inputs, desk: tampered }, at);
    const c = buildContext(a);
    c.blocks.mode_banner = modeBanner("mock");
    const violations = verifyArtifacts(readFileSync(TEMPLATE_PATH, "utf8"), c, buildCharts(inputs, a));
    expect(violations.some((v) => v.check.includes("number outside a placeholder"))).toBe(true);
  });

  it("curated mock desk notes and Notion fixtures carry no hand-written digits", () => {
    for (const o of must(inputs.desk).observations) expect(strayDigits(o.claim.replace(/\{\{[^}]+\}\}/g, ""))).toEqual([]);
  });
});
