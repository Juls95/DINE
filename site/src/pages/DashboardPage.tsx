import type { Bundle } from "../lib/bundle";
import { Chart } from "../components/Chart";
import { ErrorBoundary } from "../components/ErrorBoundary";

export function DashboardPage({ bundle }: { bundle: Bundle }) {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Dashboard</h1>
        <p>Every chart shows the query or endpoint behind it and a plain sentence about what it shows. Everything is rebuilt with <code>pnpm bul:build</code>.</p>
      </header>
      <div className="chart-grid">
        {bundle.charts.map((c) => (
          <ErrorBoundary key={c.id} label={c.title}>
            <Chart chart={c} />
          </ErrorBoundary>
        ))}
      </div>
    </section>
  );
}
