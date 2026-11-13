import { useEffect, useRef, useState } from "react";
import type { ChartView } from "../lib/bundle";

const STONE = {
  background: "transparent",
  view: { stroke: "transparent" },
  axis: {
    labelColor: "#6b5c48",
    titleColor: "#6b5c48",
    gridColor: "rgba(42,33,24,0.08)",
    domainColor: "rgba(42,33,24,0.16)",
    tickColor: "rgba(42,33,24,0.16)",
    labelFontSize: 11,
  },
  legend: { labelColor: "#6b5c48", titleColor: "#6b5c48", orient: "bottom" },
};

export function Chart({ chart }: { chart: ChartView }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let finalize: (() => void) | undefined;
    const spec = {
      ...chart.spec,
      background: "transparent",
      config: { ...(chart.spec.config as object | undefined), ...STONE },
    };
    import("vega-embed")
      .then(({ default: embed }) => {
        if (cancelled || !ref.current) return undefined;
        return embed(ref.current, spec as never, {
          actions: { export: true, source: false, compiled: false, editor: false },
          renderer: "svg",
          ast: true,
        });
      })
      .then((result) => {
        finalize = result?.finalize;
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
      finalize?.();
    };
  }, [chart.spec]);

  return (
    <figure className="chart">
      <figcaption>
        <h3>{chart.title}</h3>
        <p>{chart.sentence}</p>
      </figcaption>
      {error ? <div className="error-box">No se pudo dibujar el gráfico: {error}</div> : <div ref={ref} className="chart-canvas" aria-label={chart.title} />}
      <details>
        <summary>{chart.query_sql ? `Query: ${chart.query_file}` : "Fuente"}</summary>
        {chart.query_sql ? <pre>{chart.query_sql}</pre> : null}
        {chart.endpoint ? <pre>{chart.endpoint}</pre> : null}
      </details>
    </figure>
  );
}
