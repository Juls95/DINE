import type { Bundle } from "../lib/bundle";
import { Status } from "../components/Status";

const fmtPct = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)} %`);
const fmtIdx = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}`);

export function AgoraPage({ bundle }: { bundle: Bundle }) {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Ágora</h1>
        <p>Tres agentes, una tesis. Cada uno se evalúa por separado: qué hace, qué hizo, qué recibió, qué entregó y si pasó sus validaciones.</p>
      </header>

      <div className="agent-grid">
        {bundle.agents.map((a) => {
          const fails = a.validations.filter((v) => v.status === "fail").length;
          const warns = a.validations.filter((v) => v.status === "warn").length;
          return (
            <a key={a.id} href={`#/agentes/${a.id}`} className={`agent-card agent-${a.id}`}>
              <span className="agent-name">{a.name}</span>
              <p>{a.role}</p>
              <div className="agent-meta">
                <Status status={fails ? "fail" : warns ? "warn" : "pass"} />
                <span>{a.validations.length} validaciones · {a.runs.length} corridas</span>
              </div>
            </a>
          );
        })}
      </div>

      <h2>Debate semanal: Beary contra Bison</h2>
      <p className="muted">
        Bul compara el cambio de sentimiento (Beary) con el cambio semanal de cuentas activas (Bison). Sentimiento que sube sin actividad es un
        <em> espejismo</em>; actividad que sube sin narrativa es una <em>oportunidad no narrada</em>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Semana</th>
              <th>Tipo</th>
              <th>Beary: sentimiento</th>
              <th>Beary: cambio</th>
              <th>Bison: cuentas activas</th>
              <th>Bul: lectura</th>
            </tr>
          </thead>
          <tbody>
            {bundle.divergences.map((d) => (
              <tr key={d.week}>
                <td>{d.week}</td>
                <td>{d.reconstructed ? "reconstruida" : "en vivo"}</td>
                <td>{fmtIdx(d.sentiment_index)}</td>
                <td>{fmtIdx(d.sentiment_delta)}</td>
                <td>{fmtPct(d.onchain_change_pct)}</td>
                <td><span className={`quadrant q-${d.quadrant.replace(/\s/g, "-")}`}>{d.quadrant}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
