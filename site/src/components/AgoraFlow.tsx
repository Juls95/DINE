import type { Bundle } from "../lib/bundle";
import { BotLedger } from "./BotLedger";

const fmtPct = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)} %`);
const fmtIdx = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}`);

function Stamp({ kind, children }: { kind: "ok" | "warn" | "fail"; children: string }) {
  return <span className={`stamp stamp-${kind}`}>{children}</span>;
}

export function AgoraFlow({ bundle }: { bundle: Bundle }) {
  const beary = bundle.agents.find((a) => a.id === "beary");
  const bison = bundle.agents.find((a) => a.id === "bison");
  const bul = bundle.agents.find((a) => a.id === "bul");
  const bearyRun = beary?.runs[0];
  const bisonRun = bison?.runs[0];
  const bulRun = bul?.runs[0];
  const fails = bundle.agents.flatMap((a) => a.validations).filter((v) => v.status === "fail").length;
  const slash = [...bundle.divergences].reverse().find((d) => d.quadrant === "mirage");
  const mirages = bundle.divergences.filter((d) => d.quadrant === "mirage").length;
  const reconstructed = bundle.divergences.filter((d) => d.reconstructed).length;

  const quote = {
    thesis: "shift to 1Click Swap on Intents",
    beary: bearyRun?.summary ?? "no run",
    bison: bisonRun?.summary ?? "no run",
    mode: bundle.mode,
  };
  const verifyPayload = {
    hand_written_figures: fails ? "fail" : "pass",
    failed_validations: fails,
    hypothesis: bundle.hypothesis_verdict,
    regime: bundle.regime,
  };

  return (
    <>
      <section className="flow-block" id="problema">
        <p className="roman">I · The problem</p>
        <ol className="problem-list">
          <li><em>α.</em> A figure on X is not data — if xAI did not cite it, Beary discards it.</li>
          <li><em>β.</em> Output does not verify itself — Bison must bring the query, <code>block_date</code> and a byte cap.</li>
          <li><em>γ.</em> A rally without on-chain activity does not move the thesis. A mirage is not published as adoption.</li>
        </ol>
        <p className="flow-coda">In the agora, a thesis without evidence was noise. Beary, Bison and Bul sign separately: inputs, outputs and validations.</p>
      </section>

      <section className="flow-block" id="follow">
        <p className="roman">II · Follow a file</p>
        <h2>One thesis, traced in the ledger.</h2>
        <p className="lede">Every step below comes from <code>data/</code> or <code>THESIS.md</code>. Nothing is written by hand.</p>

        <ol className="trace">
          <li className="trace-card">
            <header>
              <strong>Beary · reading</strong>
              <span>xAI · x_search</span>
            </header>
            <pre>{JSON.stringify(quote, null, 2)}</pre>
            <p>Beary prices its own certainty: if a post is uncited, off the list or from another date, it does not get in.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Bison · chain</strong>
              <span>BigQuery · 1Click</span>
            </header>
            <p className="trace-line">
              {bisonRun ? bisonRun.summary : "no run"} · filter <code>block_date</code>
            </p>
            <p>A dry run before every query. Intents Explorer, SUCCESS only, one request every five seconds.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Bul · crossing</strong>
              <span>pure metrics</span>
            </header>
            <p className="trace-line">
              {bulRun ? bulRun.summary : "no run"} · hypothesis {bundle.hypothesis_verdict ?? "—"}
            </p>
            <p>Crosses Beary's sentiment with Bison's active accounts. A mirage does not move the thesis.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Verify · verdict</strong>
              <span>pnpm verify</span>
            </header>
            <p className="trace-line">
              {fails} validation failures{" "}
              <Stamp kind={fails ? "fail" : "ok"}>{fails ? "FAILED" : "VALIDATED"}</Stamp>
            </p>
            <pre>{JSON.stringify(verifyPayload, null, 2)}</pre>
            <p>A blind validator: if a stray digit is left in the thesis, it is not published.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Publish · thesis</strong>
              <span>{bundle.generated_at.slice(0, 10)}</span>
            </header>
            <p className="trace-line">
              THESIS.md + site{" "}
              <Stamp kind="ok">PUBLISHED</Stamp>
            </p>
            <p>Passes: the figures come from <code>metrics.json</code> and the ledger closes clean.</p>
          </li>
        </ol>

        <p className="flow-aside">— and the ending that keeps everyone honest —</p>
        <div className="slash-card">
          <div className="slash-mark" aria-hidden="true">✕</div>
          <div>
            <p className="ledger-kicker">week · quadrant · origin</p>
            {slash ? (
              <p className="trace-line">
                {slash.week} · {slash.quadrant} · {slash.reconstructed ? "reconstructed" : "live"}{" "}
                <Stamp kind="fail">MIRAGE</Stamp>
              </p>
            ) : (
              <p className="trace-line">No week is flagged as a mirage in this bundle.</p>
            )}
            <p>Sentiment that rises without on-chain activity is not billed as thesis. → the reader does not pay for the invention.</p>
          </div>
        </div>
        <p className="flow-coda">A thesis that answers for its work — in evidence, not in excuses.</p>

        <h2 className="flow-sub">The three who sign</h2>
        <p className="lede">Each bot is evaluated alone: what it contributed, how it reasoned and whether it passed its validations.</p>
        <div className="ledger">
          {bundle.agents.map((a) => (
            <BotLedger key={a.id} agent={a} bundle={bundle} />
          ))}
        </div>
      </section>

      <section className="flow-block" id="agora-publica">
        <p className="roman">III · The agora</p>
        <h2>Every verdict is public.</h2>
        <p className="lede">Beary's weekly crossing against Bison is on the table. The validator does not look at who asked.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Sentiment</th>
                <th>On-chain</th>
                <th>Verdict</th>
                <th>Origin</th>
              </tr>
            </thead>
            <tbody>
              {bundle.divergences.map((d) => (
                <tr key={d.week}>
                  <td>{d.week}</td>
                  <td>{fmtIdx(d.sentiment_index)}</td>
                  <td>{fmtPct(d.onchain_change_pct)}</td>
                  <td>{d.quadrant}</td>
                  <td>{d.reconstructed ? "reconstructed" : "live"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">
          {bundle.divergences.length} weeks · {mirages} mirages · {reconstructed} reconstructed
        </p>
      </section>

      <section className="flow-block" id="entrar">
        <p className="roman">IV · Enter the agora</p>
        <div className="enter-grid">
          <article className="enter-card">
            <h3>Read the thesis</h3>
            <p>The verdict, the pillars, what would invalidate it. Every figure comes from a placeholder.</p>
            <a className="cta" href="#/thesis">Read the thesis</a>
          </article>
          <article className="enter-card">
            <h3>Audit a thinker</h3>
            <p>One command rebuilds the thesis, the charts and this site. Each agent's file is public.</p>
            <pre>{`pnpm refresh && pnpm bul:build`}</pre>
            <a className="cta cta-ghost" href="#/dashboard">See the dashboard</a>
          </article>
        </div>
        <p className="flow-coda">Agora — the evidence layer of the thesis.</p>
      </section>
    </>
  );
}
