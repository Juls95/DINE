import { readFileSync } from "node:fs";
import { buildMockInputs, MOCK_END } from "../mock/run";
import { buildCharts } from "./charts";
import { buildContext } from "./evidence";
import { analyze, classifySpikes } from "./metrics";
import { formatMetric, MissingPlaceholderError, render, strayDigits, type RenderContext } from "./render";
import { modeBanner, TEMPLATE_PATH, verifyArtifacts } from "./verify";

const ctx: RenderContext = {
  metrics: { a: { id: "a", label: "A", value: 12.345, unit: "pct", source: "test" } },
  labels: { regime: { value: "expansión" } },
  blocks: { inner: "valor {{metric:a}}" },
};

describe("render", () => {
  it("formats metrics in es-MX and resolves nested blocks", () => {
    expect(render("{{block:inner}} · {{label:regime}} · {{param:lag_min_r}}", ctx)).toBe("valor 12.3 % · expansión · 0.3");
  });

  it("throws on unknown placeholders", () => {
    expect(() => render("{{metric:nope}}", ctx)).toThrow(MissingPlaceholderError);
  });

  it("says 'no disponible' instead of inventing a value", () => {
    expect(formatMetric({ id: "x", label: "x", value: null, unit: "count", source: "t" })).toBe("no disponible");
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
    const charts = buildCharts(inputs, analysis).map((ch, i) => (i === 0 ? { ...ch, sentence: "Creció 40 % esta semana." } : ch));
    expect(verifyArtifacts("# Tesis", c, charts).some((v) => v.check.includes("número fuera de placeholder"))).toBe(true);
  });

  it("classifies the concentrated mock airdrop as a spike, not adoption", () => {
    const spikes = classifySpikes(inputs);
    expect(spikes.length).toBeGreaterThan(0);
    expect(spikes.every((s) => s.classification === "pico")).toBe(true);
  });

  it("finds the designed 1Click lead and the mirage week", () => {
    expect(analysis.labels.lead_status?.value).toBe("se observa");
    expect(analysis.divergences.some((d) => d.quadrant === "espejismo")).toBe(true);
  });

  it("labels every Beary week as live or reconstructed", () => {
    expect(analysis.divergences.filter((d) => !d.reconstructed)).toHaveLength(1);
  });
});
