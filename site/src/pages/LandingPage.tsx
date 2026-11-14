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
    q: "What is this agora?",
    a: "A forum of three thinkers. Beary reads Notion (TickersInfo, X Creative Output, X Account Analyses) and a fixed list of X accounts, Bison queries BigQuery and 1Click Swap, and Bul crosses both readings and writes the thesis. Each is evaluated separately: inputs, outputs and validations.",
  },
  {
    q: "Why is no figure written by hand?",
    a: "THESIS.md and the chart sentences contain only placeholders. pnpm verify fills them with computed metrics and fails if a stray digit is left.",
  },
  {
    q: "Which hypothesis is debated?",
    a: "That NEAR usage is shifting to cross-chain execution (1Click Swap on Intents) and that this volume leads active accounts and contract usage.",
  },
  {
    q: "What is a mirage?",
    a: "A week in which Beary's sentiment rises and Bison's active accounts do not follow. A rally without on-chain confirmation does not move the thesis.",
  },
  {
    q: "What cannot be measured?",
    a: "Price, TVL, USD fees, total Intents volume (the Explorer only covers 1Click) and unique humans. That is written in the thesis; it is not invented.",
  },
  {
    q: "How is it rebuilt?",
    a: "pnpm demo for the simulated scenario. With credentials, pnpm refresh downloads real data and pnpm bul:build regenerates the thesis, the charts and this site.",
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
            <p className="world-by">Agora · three thinkers</p>
          </div>
          <Countdown />
        </header>

        <div className="hero-grid">
          <div className="world-copy">
            <p className="world-kicker">agora — the thesis's bond, given in the forum.</p>
            <h1>{copy.title}</h1>
            <p className="world-quote">“Whoever brings no evidence does not speak.”</p>
            <p>{copy.lede}</p>
            <ForumBar />
            <p className="cta-note">
              <span className="live-dot" /> {bundle.mode === "mock" ? "simulated data" : "real data"} · {bundle.generated_at.slice(0, 10)}
            </p>
            <button type="button" className="scroll-cue" onClick={() => scrollToId("follow")}>Follow a file ↓</button>
          </div>

          <aside className="verdict-card">
            <div className="verdict-card-top">
              <span><i className="live-dot" /> Thesis in the agora</span>
              <em>{bundle.mode === "mock" ? "mock" : "live"}</em>
            </div>
            <strong className="verdict-main">{bundle.hypothesis_verdict ?? "no data"}</strong>
            <dl className="verdict-dl">
              <div>
                <dt>Stance</dt>
                <dd>{bundle.stance ?? "—"}</dd>
              </div>
              <div>
                <dt>Timing</dt>
                <dd>{bundle.technical_bias ?? "—"}</dd>
              </div>
              <div>
                <dt>Regime</dt>
                <dd>{bundle.regime ?? "—"}</dd>
              </div>
              <div>
                <dt>Last week</dt>
                <dd>{lastWeek ? lastWeek.quadrant : "—"}</dd>
              </div>
              <div>
                <dt>Validations</dt>
                <dd>{checks.ok} OK · {checks.warn} warning · {checks.fail} fail</dd>
              </div>
            </dl>
            <a className="verdict-link" href="#/thesis">Read the full thesis →</a>
          </aside>
        </div>

        <div className="orchestra">
          <button type="button" className="actor actor-beary" onClick={() => scrollToId("reasoning-beary")}>
            <span className="bubble">X is not data</span>
            <SpriteBeary />
            <strong>Beary</strong>
          </button>
          <div className="actor actor-tablet" aria-hidden="true">
            <SpriteTablet />
            <strong>Estela</strong>
          </div>
          <button type="button" className="actor actor-bison" onClick={() => scrollToId("reasoning-bison")}>
            <span className="bubble">block_date</span>
            <SpriteBison />
            <strong>Bison</strong>
          </button>
          <button type="button" className="actor actor-bul" onClick={() => scrollToId("reasoning-bul")}>
            <span className="bubble">{bundle.hypothesis_verdict ?? "synthesis"}</span>
            <SpriteBul />
            <strong>Bul</strong>
          </button>
        </div>

        <button type="button" className="ask" onClick={() => setFaq(true)}>
          <span>?</span> I have a question
        </button>
      </div>

      <div className="meander" aria-hidden="true" />

      <section className="forum" id="reasoning">
        <AgoraFlow bundle={bundle} />
      </section>

      {faq && (
        <Overlay title="Questions" onClose={() => setFaq(false)}>
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
            <a className="cta" href="#/methodology">Methodology</a>
            <a className="cta cta-ghost" href="#/thesis">Thesis</a>
          </div>
        </Overlay>
      )}
    </div>
  );
}
