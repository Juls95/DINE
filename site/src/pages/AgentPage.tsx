import type { Bundle } from "../lib/bundle";
import { Chart } from "../components/Chart";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Status } from "../components/Status";

export function AgentPage({ bundle, id }: { bundle: Bundle; id: string }) {
  const agent = bundle.agents.find((a) => a.id === id);
  if (!agent) return <section className="page"><p>Agente desconocido.</p></section>;
  const charts = bundle.charts.filter((c) => c.agent === agent.id);
  return (
    <section className={`page agent-page agent-${agent.id}`}>
      <header className="page-head">
        <span className="eyebrow">Agente</span>
        <h1>{agent.name}</h1>
        <p>{agent.role}</p>
      </header>

      <div className="two-col">
        <div>
          <h2>Qué hace</h2>
          <ul>{agent.does.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
        <div>
          <h2>Entradas</h2>
          <ul>{agent.inputs.map((d) => <li key={d}><code>{d}</code></li>)}</ul>
          <h2>Salidas</h2>
          <ul>{agent.outputs.map((d) => <li key={d}><code>{d}</code></li>)}</ul>
        </div>
      </div>

      <h2>Validaciones</h2>
      <ul className="validations">
        {agent.validations.map((v) => (
          <li key={v.name}>
            <Status status={v.status} />
            <span className="v-name">{v.name}</span>
            <span className="muted">{v.detail}</span>
          </li>
        ))}
      </ul>

      <h2>Qué hizo</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Resumen</th><th>Detalle</th></tr></thead>
          <tbody>
            {agent.runs.map((r, i) => (
              <tr key={`${r.at}-${i}`}>
                <td>{r.at}</td>
                <td>{r.summary}</td>
                <td className="mono">{Object.entries(r.details).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {charts.length > 0 && <h2>Salidas visuales</h2>}
      <div className="chart-grid">
        {charts.map((c) => (
          <ErrorBoundary key={c.id} label={c.title}>
            <Chart chart={c} />
          </ErrorBoundary>
        ))}
      </div>
    </section>
  );
}
