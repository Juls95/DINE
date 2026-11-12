/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { App, MockBanner, Page } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Markdown } from "./lib/markdown";
import { parseBundle, type Bundle } from "./lib/bundle";

jest.mock("vega-embed", () => ({ __esModule: true, default: jest.fn().mockResolvedValue({ finalize: jest.fn() }) }));

const agent = (id: "beary" | "bison" | "bul", status: "pass" | "warn" | "fail" = "pass") => ({
  id, name: id[0]?.toUpperCase() + id.slice(1), role: `rol de ${id}`, does: ["hace algo"], inputs: ["entrada"], outputs: ["salida"],
  runs: [{ at: "2026-11-09", summary: "corrida", details: { filas: 3 } }],
  validations: [{ name: "check", status, detail: "detalle" }],
});

const bundle: Bundle = {
  mode: "mock",
  generated_at: "2026-11-09T06:00:00.000Z",
  thesis_md: "# Tesis\n\n## 1. Afirmación\n\nTexto **clave**.",
  hypothesis_verdict: "respaldada",
  regime: "expansión",
  metrics: {},
  charts: [{ id: "daa", title: "Cuentas activas", agent: "bison", query_file: "q.sql", endpoint: null, query_sql: "SELECT 1", sentence: "Frase simple.", spec: {} }],
  divergences: [{ week: "2026-W44", from: "2026-10-26", reconstructed: true, sentiment_index: 0.7, sentiment_delta: 0.5, onchain_change_pct: -8, quadrant: "espejismo" }],
  spikes: [],
  beary: { weeks: [], latest_posts: [], discard_reasons: { not_in_citations: 2 } },
  agents: [agent("beary", "warn"), agent("bison"), agent("bul")],
};

describe("site", () => {
  it("shows the simulated-data banner only in mock mode", () => {
    const { rerender } = render(<MockBanner mode="mock" />);
    expect(screen.getByRole("status")).toHaveTextContent("DATOS SIMULADOS");
    rerender(<MockBanner mode="live" />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("Ágora evaluates each agent separately and shows the debate table", () => {
    render(<Page route="/agora" bundle={bundle} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByText("Atención")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "espejismo" })).toBeInTheDocument();
  });

  it("agent page lists inputs, outputs and validations", () => {
    render(<Page route="/agentes/bison" bundle={bundle} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bison");
    expect(screen.getByText("entrada")).toBeInTheDocument();
    expect(screen.getByText("Query: q.sql")).toBeInTheDocument();
  });

  it("dashboard pairs every chart with its sentence and query", () => {
    render(<Page route="/dashboard" bundle={bundle} />);
    expect(screen.getByText("Frase simple.")).toBeInTheDocument();
    expect(screen.getByText("SELECT 1")).toBeInTheDocument();
  });

  it("App surfaces a load error instead of a blank page", async () => {
    render(<App load={() => Promise.reject(new Error("sin bundle"))} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("sin bundle");
  });

  it("ErrorBoundary isolates a broken section", () => {
    const Boom = () => {
      throw new Error("falló");
    };
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ErrorBoundary label="Gráfico"><Boom /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("Gráfico: no se pudo mostrar.");
  });

  it("parseBundle fails fast on an incompatible bundle", () => {
    expect(() => parseBundle({ mode: "mock" })).toThrow(/bundle.json inválido/);
    expect(parseBundle(bundle).mode).toBe("mock");
  });
});

describe("Markdown", () => {
  it("renders tables, lists and bold", () => {
    render(<Markdown source={"- **uno**\n- dos\n\n| A | B |\n| --- | --- |\n| x | y |"} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("uno").tagName).toBe("STRONG");
  });
});
