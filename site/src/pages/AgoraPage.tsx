import type { Bundle } from "../lib/bundle";
import { Status } from "../components/Status";

const fmtPct = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)} %`);
const fmtIdx = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}`);

export function AgoraPage({ bundle }: { bundle: Bundle }) {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Agora</h1>
        <p>Three agents, one thesis. Each is evaluated separately: what it does, what it did, what it received, what it delivered and whether it passed its validations.</p>
      </header>

      <div className="agent-grid">
        {bundle.agents.map((a) => {
          const fails = a.validations.filter((v) => v.status === "fail").length;
          const warns = a.validations.filter((v) => v.status === "warn").length;
          return (
            <a key={a.id} href={`#/agents/${a.id}`} className={`agent-card agent-${a.id}`}>
              <span className="agent-name">{a.name}</span>
              <p>{a.role}</p>
              <div className="agent-meta">
                <Status status={fails ? "fail" : warns ? "warn" : "pass"} />
                <span>{a.validations.length} validations · {a.runs.length} runs</span>
              </div>
            </a>
          );
        })}
      </div>

      <h2>Weekly debate: Beary versus Bison</h2>
      <p className="muted">
        Bul compares the change in sentiment (Beary) with the weekly change in active accounts (Bison). Sentiment that rises without activity is a
        <em> mirage</em>; activity that rises without a narrative is an <em>unnarrated opportunity</em>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Type</th>
              <th>Beary: sentiment</th>
              <th>Beary: change</th>
              <th>Bison: active accounts</th>
              <th>Bul: reading</th>
            </tr>
          </thead>
          <tbody>
            {bundle.divergences.map((d) => (
              <tr key={d.week}>
                <td>{d.week}</td>
                <td>{d.reconstructed ? "reconstructed" : "live"}</td>
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
