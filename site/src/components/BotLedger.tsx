import type { AgentCard } from "../../../src/bul/agents";
import type { Bundle } from "../lib/bundle";
import { SpriteBeary, SpriteBison, SpriteBul } from "./PixelSprites";
import { Status } from "./Status";

const STEPS = ["α", "β", "γ", "δ", "ε"];

function Sprite({ id }: { id: AgentCard["id"] }) {
  if (id === "beary") return <SpriteBeary />;
  if (id === "bison") return <SpriteBison />;
  return <SpriteBul />;
}

function contribution(agent: AgentCard, bundle: Bundle): string {
  const last = agent.runs[0];
  const run = last ? `${last.summary} (${last.at})` : "no run yet";
  if (agent.id === "beary") {
    const discarded = Object.values(bundle.beary.discard_reasons).reduce((n, x) => n + x, 0);
    const notionHits = bundle.beary.notion?.hits.length;
    const notion = notionHits !== undefined ? ` Notion: ${notionHits} NEAR rows.` : "";
    return `${run}. Discarded ${discarded} posts that failed citation, account or date checks.${notion}`;
  }
  if (agent.id === "bison") {
    const chart = bundle.charts.find((c) => c.agent === "bison");
    return chart ? `${run}. ${chart.sentence}` : run;
  }
  const week = bundle.divergences.at(-1);
  return week ? `${run}. Last week crossed: ${week.week} · ${week.quadrant}.` : run;
}

export function BotLedger({ agent, bundle }: { agent: AgentCard; bundle: Bundle }) {
  const fails = agent.validations.filter((v) => v.status === "fail").length;
  const warns = agent.validations.filter((v) => v.status === "warn").length;
  return (
    <article className={`ledger-card agent-${agent.id}`} id={`reasoning-${agent.id}`}>
      <header className="ledger-head">
        <Sprite id={agent.id} />
        <div>
          <p className="ledger-kicker">Thinker · {agent.id}</p>
          <h3>{agent.name}</h3>
          <p>{agent.role}</p>
        </div>
        <Status status={fails ? "fail" : warns ? "warn" : "pass"} />
      </header>

      <div className="ledger-block">
        <h4>Contribution</h4>
        <p>{contribution(agent, bundle)}</p>
        <p className="muted">
          Outputs:{" "}
          {agent.outputs.map((o, i) => (
            <span key={o}>{i > 0 ? " · " : null}<code>{o}</code></span>
          ))}
        </p>
      </div>

      <div className="ledger-block">
        <h4>Reasoning</h4>
        <ol className="ledger-steps">
          {agent.does.map((step, i) => (
            <li key={step}>
              <em>{STEPS[i] ?? String(i + 1)}</em>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="ledger-block">
        <h4>Validity</h4>
        <ul className="validations">
          {agent.validations.map((v) => (
            <li key={v.name}>
              <Status status={v.status} />
              <span className="v-name">{v.name}</span>
              <span className="muted">{v.detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <a className="ledger-more" href={`#/agents/${agent.id}`}>{agent.name}'s file →</a>
    </article>
  );
}
