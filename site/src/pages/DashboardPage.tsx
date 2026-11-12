import type { Bundle } from "../lib/bundle";
import { Chart } from "../components/Chart";
import { ErrorBoundary } from "../components/ErrorBoundary";

export function DashboardPage({ bundle }: { bundle: Bundle }) {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Dashboard</h1>
        <p>Cada gráfico muestra la query o el endpoint detrás de él y una frase simple sobre lo que muestra. Todo se reconstruye con <code>pnpm bul:build</code>.</p>
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
