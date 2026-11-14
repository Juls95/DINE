/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { App, MockBanner, Page } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Markdown } from "./lib/markdown";
import { parseBundle, type Bundle } from "./lib/bundle";
import { verdictCopy } from "./lib/verdict";
import { safeHref } from "./lib/safe-url";

jest.mock("vega-embed", () => ({ __esModule: true, default: jest.fn().mockResolvedValue({ finalize: jest.fn() }) }));

const agent = (id: "beary" | "bison" | "bul", status: "pass" | "warn" | "fail" = "pass") => ({
  id, name: id[0]?.toUpperCase() + id.slice(1), role: `role of ${id}`, does: ["does something"], inputs: ["input"], outputs: ["output"],
  runs: [{ at: "2026-11-09", summary: "run", details: { rows: 3 } }],
  validations: [{ name: "check", status, detail: "detail" }],
});

const bundle: Bundle = {
  mode: "mock",
  generated_at: "2026-11-09T06:00:00.000Z",
  thesis_md: "# Thesis\n\n## 1. Claim\n\nKey **text**.",
  hypothesis_verdict: "supported by current data",
  regime: "expansion",
  stance: "constructive on direction; timing is not confirmed",
  technical_bias: "neutral",
  desk: null,
  metrics: {},
  charts: [{ id: "daa", title: "Daily active accounts", agent: "bison", query_file: "q.sql", endpoint: null, query_sql: "SELECT 1", sentence: "Plain sentence.", spec: {} }],
  divergences: [{ week: "2026-W44", from: "2026-10-26", reconstructed: true, sentiment_index: 0.7, sentiment_delta: 0.5, onchain_change_pct: -8, quadrant: "mirage" }],
  spikes: [],
  beary: { weeks: [], latest_posts: [], discard_reasons: { not_in_citations: 2 }, notion: null },
  agents: [agent("beary", "warn"), agent("bison"), agent("bul")],
};

describe("site", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the simulated-data banner only in mock mode", () => {
    const { rerender } = render(<MockBanner mode="mock" />);
    expect(screen.getByRole("status")).toHaveTextContent("SIMULATED DATA");
    rerender(<MockBanner mode="live" />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("landing states the thesis verdict and the reasoning of each bot", () => {
    render(<Page route="/" bundle={bundle} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/thesis holds/i);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByRole("button", { name: /back/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /comment/i }));
    fireEvent.change(screen.getByLabelText(/comment/i), { target: { value: "what about the validations?" } });
    fireEvent.click(screen.getByRole("button", { name: /post/i }));
    expect(screen.getByText("what about the validations?")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bison" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bul" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Beary's file/i })).toHaveAttribute("href", "#/agents/beary");
    expect(screen.getAllByText("does something")).toHaveLength(3);
    expect(screen.getByText(/i · the problem/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /one thesis, traced/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /every verdict is public/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /read the thesis/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /audit a thinker/i })).toBeInTheDocument();
  });

  it("ignores tampered comments in localStorage instead of crashing", () => {
    localStorage.setItem("rdc.agora.comments", JSON.stringify([{ id: "1", text: "ok", at: "2026-11-14" }, { id: 2, text: { x: 1 }, at: [] }, "junk", null]));
    render(<Page route="/" bundle={bundle} />);
    fireEvent.click(screen.getByRole("button", { name: /comment/i }));
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("safeHref only lets https links through", () => {
    expect(safeHref("https://x.com/near")).toBe("https://x.com/near");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "http://x.com", "//x.com", "", null, undefined]) expect(safeHref(bad)).toBeUndefined();
  });

  it("verdictCopy never treats 'not supported' as a pass", () => {
    expect(verdictCopy("not supported by current data", "contraction").title).toMatch(/does not hold/i);
    expect(verdictCopy("supported by current data", "expansion").title).toMatch(/holds\./i);
    expect(verdictCopy("partially supported", "sideways").title).toMatch(/in part/i);
  });

  it("Agora evaluates each agent separately and shows the debate table", () => {
    render(<Page route="/agora" bundle={bundle} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "mirage" })).toBeInTheDocument();
  });

  it("agent page lists inputs, outputs and validations", () => {
    render(<Page route="/agents/bison" bundle={bundle} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bison");
    expect(screen.getByText("input")).toBeInTheDocument();
    expect(screen.getByText("Query: q.sql")).toBeInTheDocument();
  });

  it("social page shows the Notion NEAR dossier when Beary has a snapshot", () => {
    const withNotion: Bundle = {
      ...bundle,
      beary: {
        ...bundle.beary,
        notion: {
          mode: "mock",
          generated_at: "2026-11-14T13:00:00.000Z",
          query: "NEAR",
          databases: {
            tickers_info: "99687de2-cbd0-4b2e-9e1c-0dd0a3211357",
            x_creative_output: "460be6fc-c001-4330-9832-c55f647c5c23",
            x_account_analyses: "bbaf87b8-dfa1-4cce-acb3-f4f69a0c383d",
          },
          counts: { tickers: 1, creative: 0, analyses: 0, scanned_pages: 3, discarded_false_positives: 1 },
          sentiment_tally: { positive: 0, neutral: 0, negative: 0, mixed: 0 },
          themes: [{ id: "intents_security", title: "NEAR Intents / Omni", evidence_count: 1, summary: "Omni exploit ~$3.8M" }],
          paragraphs: ["Beary read TickersInfo looking for NEAR."],
          hits: [{
            source: "tickers_info", page_id: "1", title: "NEAR Intents", date: "2026-10-02",
            sentiment: null, account: "Julian", topic: "crypto", excerpt: "Omni exploit ~$3.8M", url: null,
          }],
        },
      },
    };
    render(<Page route="/social" bundle={withNotion} />);
    expect(screen.getByRole("heading", { name: /notion dossier/i })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "NEAR Intents" })).toBeInTheDocument();
    expect(screen.getAllByText(/Omni exploit/).length).toBeGreaterThan(0);
  });

  it("social page lists desk observations as claims, and the verdict card shows stance and technical bias", () => {
    const withDesk: Bundle = {
      ...bundle,
      desk: {
        mode: "mock", generated_at: "2026-11-14T06:00:00.000Z", source: "notion", desks: ["arkham", "Zeneca"], figures: [],
        observations: [{ id: "whale_long", date: "2026-10-26", desk: "arkham", topic: "positioning", claim: "A whale holds a leveraged NEAR long." }],
      },
    };
    const social = render(<Page route="/social" bundle={withDesk} />);
    expect(screen.getByRole("heading", { name: /desk observations/i })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "A whale holds a leveraged NEAR long." })).toBeInTheDocument();
    expect(screen.getByText(/claims by public accounts, not measurements/i)).toBeInTheDocument();
    social.unmount();
    render(<Page route="/" bundle={withDesk} />);
    expect(screen.getByText("constructive on direction; timing is not confirmed")).toBeInTheDocument();
    expect(screen.getByText("neutral")).toBeInTheDocument();
  });

  it("dashboard pairs every chart with its sentence and query", () => {
    render(<Page route="/dashboard" bundle={bundle} />);
    expect(screen.getByText("Plain sentence.")).toBeInTheDocument();
    expect(screen.getByText("SELECT 1")).toBeInTheDocument();
  });

  it("App surfaces a load error instead of a blank page", async () => {
    render(<App load={() => Promise.reject(new Error("no bundle"))} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("no bundle");
  });

  it("ErrorBoundary isolates a broken section", () => {
    const Boom = () => {
      throw new Error("failed");
    };
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ErrorBoundary label="Chart"><Boom /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("Chart: could not be displayed.");
  });

  it("parseBundle rejects a bundle whose links are not https", () => {
    const tampered = { ...bundle, beary: { ...bundle.beary, latest_posts: [{ url: "javascript:alert(1)" }] } };
    expect(() => parseBundle(tampered)).toThrow(/Invalid bundle.json/);
  });

  it("parseBundle fails fast on an incompatible bundle", () => {
    expect(() => parseBundle({ mode: "mock" })).toThrow(/Invalid bundle.json/);
    expect(parseBundle(bundle).mode).toBe("mock");
  });
});

describe("Markdown", () => {
  it("renders tables, lists and bold", () => {
    render(<Markdown source={"- **one**\n- two\n\n| A | B |\n| --- | --- |\n| x | y |"} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("one").tagName).toBe("STRONG");
  });
});
