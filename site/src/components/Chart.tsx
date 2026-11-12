import { useEffect, useRef, useState } from "react";
import type { ChartView } from "../lib/bundle";

export function Chart({ chart }: { chart: ChartView }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let finalize: (() => void) | undefined;
    import("vega-embed")
      .then(({ default: embed }) => {
        if (cancelled || !ref.current) return undefined;
        return embed(ref.current, chart.spec as never, {
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
