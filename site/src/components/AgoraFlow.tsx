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
  const slash = [...bundle.divergences].reverse().find((d) => d.quadrant === "espejismo");
  const mirages = bundle.divergences.filter((d) => d.quadrant === "espejismo").length;
  const reconstructed = bundle.divergences.filter((d) => d.reconstructed).length;

  const quote = {
    tesis: "desplazamiento a 1Click Swap sobre Intents",
    beary: bearyRun?.summary ?? "sin corrida",
    bison: bisonRun?.summary ?? "sin corrida",
    modo: bundle.mode,
  };
  const verifyPayload = {
    cifras_a_mano: fails ? "fail" : "pass",
    validaciones_fail: fails,
    hipotesis: bundle.hypothesis_verdict,
    regimen: bundle.regime,
  };

  return (
    <>
      <section className="flow-block" id="problema">
        <p className="roman">I · El problema</p>
        <ol className="problem-list">
          <li><em>α.</em> Una cifra en X no es un dato — si xAI no la citó, Beary la descarta.</li>
          <li><em>β.</em> El output no se verifica solo — Bison tiene que traer query, <code>block_date</code> y tope de bytes.</li>
          <li><em>γ.</em> Un rally sin on-chain no mueve la tesis. El espejismo no se publica como adopción.</li>
        </ol>
        <p className="flow-coda">En el ágora, una tesis sin evidencia era ruido. Beary, Bison y Bul firman por separado: entradas, salidas y validaciones.</p>
      </section>

      <section className="flow-block" id="follow">
        <p className="roman">II · Seguir un expediente</p>
        <h2>Una tesis, trazada en el libro.</h2>
        <p className="lede">Cada paso de abajo sale de <code>data/</code> o de <code>THESIS.md</code>. Nada se escribe a mano.</p>

        <ol className="trace">
          <li className="trace-card">
            <header>
              <strong>Beary · lectura</strong>
              <span>xAI · x_search</span>
            </header>
            <pre>{JSON.stringify(quote, null, 2)}</pre>
            <p>Beary precifica su propia certeza: si el post no está citado, fuera de lista o de otra fecha, no entra.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Bison · cadena</strong>
              <span>BigQuery · 1Click</span>
            </header>
            <p className="trace-line">
              {bisonRun ? bisonRun.summary : "sin corrida"} · filtro <code>block_date</code>
            </p>
            <p>Dry run antes de cada query. Intents Explorer, solo SUCCESS, una solicitud cada cinco segundos.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Bul · cruce</strong>
              <span>métricas puras</span>
            </header>
            <p className="trace-line">
              {bulRun ? bulRun.summary : "sin corrida"} · hipótesis {bundle.hypothesis_verdict ?? "—"}
            </p>
            <p>Cruza el sentimiento de Beary con las cuentas activas de Bison. Un espejismo no mueve la tesis.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Verify · veredicto</strong>
              <span>pnpm verify</span>
            </header>
            <p className="trace-line">
              {fails} fallos de validación{" "}
              <Stamp kind={fails ? "fail" : "ok"}>{fails ? "FALLA" : "VALIDADA"}</Stamp>
            </p>
            <pre>{JSON.stringify(verifyPayload, null, 2)}</pre>
            <p>Un validador ciego: si queda un dígito suelto en la tesis, no se publica.</p>
          </li>
          <li className="trace-card">
            <header>
              <strong>Publicar · tesis</strong>
              <span>{bundle.generated_at.slice(0, 10)}</span>
            </header>
            <p className="trace-line">
              THESIS.md + sitio{" "}
              <Stamp kind="ok">PUBLICADA</Stamp>
            </p>
            <p>Pasa: las cifras salen de <code>metrics.json</code> y el libro cierra limpio.</p>
          </li>
        </ol>

        <p className="flow-aside">— y el final que mantiene a todos honestos —</p>
        <div className="slash-card">
          <div className="slash-mark" aria-hidden="true">✕</div>
          <div>
            <p className="ledger-kicker">semana · cuadrante · origen</p>
            {slash ? (
              <p className="trace-line">
                {slash.week} · {slash.quadrant} · {slash.reconstructed ? "reconstruida" : "en vivo"}{" "}
                <Stamp kind="fail">ESPEJISMO</Stamp>
              </p>
            ) : (
              <p className="trace-line">Ninguna semana marcada como espejismo en este bundle.</p>
            )}
            <p>Sentimiento que sube sin actividad on-chain no se cobra como tesis. → el lector no paga el invento.</p>
          </div>
        </div>
        <p className="flow-coda">Una tesis que responde por su trabajo — en evidencia, no en disculpas.</p>

        <h2 className="flow-sub">Los tres que firman</h2>
        <p className="lede">Cada bot se evalúa solo: qué aportó, cómo razonó y si pasó sus validaciones.</p>
        <div className="ledger">
          {bundle.agents.map((a) => (
            <BotLedger key={a.id} agent={a} bundle={bundle} />
          ))}
        </div>
      </section>

      <section className="flow-block" id="agora-publica">
        <p className="roman">III · El ágora</p>
        <h2>Cada veredicto queda público.</h2>
        <p className="lede">El cruce semanal de Beary contra Bison está en la mesa. El validador no mira quién lo pidió.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Semana</th>
                <th>Sentimiento</th>
                <th>On-chain</th>
                <th>Veredicto</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>
              {bundle.divergences.map((d) => (
                <tr key={d.week}>
                  <td>{d.week}</td>
                  <td>{fmtIdx(d.sentiment_index)}</td>
                  <td>{fmtPct(d.onchain_change_pct)}</td>
                  <td>{d.quadrant}</td>
                  <td>{d.reconstructed ? "reconstruida" : "en vivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">
          {bundle.divergences.length} semanas · {mirages} espejismos · {reconstructed} reconstruidas
        </p>
      </section>

      <section className="flow-block" id="entrar">
        <p className="roman">IV · Entrar al ágora</p>
        <div className="enter-grid">
          <article className="enter-card">
            <h3>Leer la tesis</h3>
            <p>El veredicto, los pilares, qué la invalidaría. Toda cifra sale de un placeholder.</p>
            <a className="cta" href="#/tesis">Leer la tesis</a>
          </article>
          <article className="enter-card">
            <h3>Auditar a un pensador</h3>
            <p>Un comando reconstruye tesis, gráficos y este sitio. El expediente de cada agente es público.</p>
            <pre>{`pnpm refresh && pnpm bul:build`}</pre>
            <a className="cta cta-ghost" href="#/dashboard">Ver el dashboard</a>
          </article>
        </div>
        <p className="flow-coda">Ágora — la capa de evidencia de la tesis.</p>
      </section>
    </>
  );
}
