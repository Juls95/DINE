import { useMemo, useState } from "react";
import type { Bundle } from "../lib/bundle";
import { verdictCopy } from "../lib/verdict";
import { AgoraFlow } from "../components/AgoraFlow";
import { Coliseum } from "../components/Coliseum";
import { Countdown } from "../components/Countdown";
import { ForumBar } from "../components/ForumBar";
import { Overlay } from "../components/Overlay";
import { SpriteBeary, SpriteBison, SpriteBul, SpriteTablet } from "../components/PixelSprites";

const MOTES = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 2 + (i % 3),
  delay: `${(i % 9) * 1.1}s`,
  duration: `${10 + (i % 7)}s`,
}));

const FAQS = [
  {
    q: "¿Qué es este ágora?",
    a: "Un foro de tres pensadores. Beary lee cuentas fijas de X, Bison consulta BigQuery y 1Click Swap, Bul cruza ambas lecturas y escribe la tesis. Cada uno se evalúa por separado: entradas, salidas y validaciones.",
  },
  {
    q: "¿Por qué ninguna cifra está escrita a mano?",
    a: "THESIS.md y las frases de los gráficos solo tienen placeholders. pnpm verify los rellena con métricas calculadas y falla si queda un dígito suelto.",
  },
  {
    q: "¿Qué hipótesis se debate?",
    a: "Que el uso de NEAR se desplaza a la ejecución cross-chain (1Click Swap sobre Intents) y que ese volumen anticipa las cuentas activas y el uso de contratos.",
  },
  {
    q: "¿Qué es un espejismo?",
    a: "Una semana en la que el sentimiento de Beary sube y las cuentas activas de Bison no lo acompañan. Un rally sin confirmación on-chain no mueve la tesis.",
  },
  {
    q: "¿Qué no se puede medir?",
    a: "Precio, TVL, fees en USD, volumen total de Intents (el Explorer solo cubre 1Click) y humanos únicos. Eso está escrito en la tesis, no se inventa.",
  },
  {
    q: "¿Cómo se reconstruye?",
    a: "pnpm demo para el escenario simulado. Con credenciales, pnpm refresh baja datos reales y pnpm bul:build regenera tesis, gráficos y este sitio.",
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingPage({ bundle }: { bundle: Bundle }) {
  const [faq, setFaq] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const copy = verdictCopy(bundle.hypothesis_verdict, bundle.regime);
  const lastWeek = bundle.divergences.at(-1);
  const checks = useMemo(() => {
    const all = bundle.agents.flatMap((a) => a.validations);
    return {
      ok: all.filter((v) => v.status === "pass").length,
      warn: all.filter((v) => v.status === "warn").length,
      fail: all.filter((v) => v.status === "fail").length,
    };
  }, [bundle.agents]);

  return (
    <div className="agora-page">
      <div className="world-hero">
        <div className="sky" aria-hidden="true">
          <div className="sun">
            <span className="sun-rays" />
            <span className="sun-core" />
          </div>
          <div className="haze" />
          {MOTES.map((m, i) => (
            <span
              key={i}
              className="mote"
              style={{ left: m.left, width: m.size, height: m.size, animationDelay: m.delay, animationDuration: m.duration }}
            />
          ))}
          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="cloud cloud-c" />
          <span className="bird bird-a" />
          <span className="bird bird-b" />
          <span className="bird bird-c" />
        </div>

        <Coliseum />
        <div className="column column-l" aria-hidden="true"><span className="drape" /></div>
        <div className="column column-r" aria-hidden="true"><span className="drape drape-delay" /></div>
        <div className="cypress cypress-l" aria-hidden="true" />
        <div className="cypress cypress-r" aria-hidden="true" />

        <header className="world-top">
          <div className="world-brand">
            <a href="#/" className="world-logo">NEAR RDC</a>
            <p className="world-by">Ágora · tres pensadores</p>
          </div>
          <Countdown />
        </header>

        <div className="hero-grid">
          <div className="world-copy">
            <p className="world-kicker">ágora — la fianza de la tesis, dada en el foro.</p>
            <h1>{copy.title}</h1>
            <p className="world-quote">«El que no trae evidencia no habla.»</p>
            <p>{copy.lede}</p>
            <ForumBar />
            <p className="cta-note">
              <span className="live-dot" /> {bundle.mode === "mock" ? "datos simulados" : "datos reales"} · {bundle.generated_at.slice(0, 10)}
            </p>
            <button type="button" className="scroll-cue" onClick={() => scrollToId("follow")}>Seguir un expediente ↓</button>
          </div>

          <aside className="verdict-card">
            <div className="verdict-card-top">
              <span><i className="live-dot" /> Tesis en el ágora</span>
              <em>{bundle.mode === "mock" ? "mock" : "live"}</em>
            </div>
            <strong className="verdict-main">{bundle.hypothesis_verdict ?? "sin datos"}</strong>
            <dl className="verdict-dl">
              <div>
                <dt>Régimen</dt>
                <dd>{bundle.regime ?? "—"}</dd>
              </div>
              <div>
                <dt>Última semana</dt>
                <dd>{lastWeek ? lastWeek.quadrant : "—"}</dd>
              </div>
              <div>
                <dt>Validaciones</dt>
                <dd>{checks.ok} OK · {checks.warn} atención · {checks.fail} falla</dd>
              </div>
            </dl>
            <a className="verdict-link" href="#/tesis">Leer la tesis completa →</a>
          </aside>
        </div>

        <div className="orchestra">
          <button type="button" className="actor actor-beary" onClick={() => scrollToId("razonamiento-beary")}>
            <span className="bubble">X no es dato</span>
            <SpriteBeary />
            <strong>Beary</strong>
          </button>
          <div className="actor actor-tablet" aria-hidden="true">
            <SpriteTablet />
            <strong>Estela</strong>
          </div>
          <button type="button" className="actor actor-bison" onClick={() => scrollToId("razonamiento-bison")}>
            <span className="bubble">block_date</span>
            <SpriteBison />
            <strong>Bison</strong>
          </button>
          <button type="button" className="actor actor-bul" onClick={() => scrollToId("razonamiento-bul")}>
            <span className="bubble">{bundle.hypothesis_verdict ?? "síntesis"}</span>
            <SpriteBul />
            <strong>Bul</strong>
          </button>
        </div>

        <button type="button" className="ask" onClick={() => setFaq(true)}>
          <span>?</span> Tengo una pregunta
        </button>
      </div>

      <div className="meander" aria-hidden="true" />

      <section className="forum" id="razonamiento">
        <AgoraFlow bundle={bundle} />
      </section>

      {faq && (
        <Overlay title="Preguntas" onClose={() => setFaq(false)}>
          {FAQS.map((item, i) => (
            <div key={item.q} className="faq">
              <button type="button" className="faq-q" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                {item.q}
                <span>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i ? <p className="faq-a">{item.a}</p> : null}
            </div>
          ))}
          <div className="overlay-actions">
            <a className="cta" href="#/metodologia">Metodología</a>
            <a className="cta cta-ghost" href="#/tesis">Tesis</a>
          </div>
        </Overlay>
      )}
    </div>
  );
}
