import type { Bundle } from "../lib/bundle";

const REASON: Record<string, string> = {
  not_in_citations: "Not cited by xAI (possible hallucination)",
  handle_not_allowed: "Account outside the list",
  outside_date_window: "Outside the queried date",
  invalid_shape: "Malformed answer",
  duplicate: "Duplicate",
};

const SOURCE_LABEL: Record<string, string> = {
  tickers_info: "TickersInfo",
  x_creative_output: "X Creative Output",
  x_account_analyses: "X Account Analyses",
};

export function SocialPage({ bundle }: { bundle: Bundle }) {
  const { weeks, latest_posts, discard_reasons, notion } = bundle.beary;
  const { desk } = bundle;
  const latest = weeks.at(-1);
  return (
    <section className="page">
      <header className="page-head">
        <h1>Social summary</h1>
        <p>
          What Beary read in Notion and on X about NEAR. Figures that appear in posts or tables are never used as data: they are marked as
          claims that Bison must verify.
        </p>
      </header>

      {notion ? (
        <>
          <h2>Notion dossier · NEAR</h2>
          <p className="muted">
            {notion.generated_at.slice(0, 10)} · {notion.counts.tickers} TickersInfo · {notion.counts.creative} X Creative Output · {notion.counts.analyses} X Account Analyses · {notion.counts.discarded_false_positives} false matches discarded
          </p>
          <div className="stat-row">
            <div className="stat"><span>Positive</span><strong>{notion.sentiment_tally.positive}</strong></div>
            <div className="stat"><span>Mixed</span><strong>{notion.sentiment_tally.mixed}</strong></div>
            <div className="stat"><span>Neutral</span><strong>{notion.sentiment_tally.neutral}</strong></div>
            <div className="stat"><span>Negative</span><strong>{notion.sentiment_tally.negative}</strong></div>
          </div>
          {notion.paragraphs.map((p) => <p key={p.slice(0, 48)}>{p}</p>)}
          {notion.themes.length > 0 ? (
            <>
              <h3>Themes</h3>
              <ul>{notion.themes.map((t) => <li key={t.id}><strong>{t.title}</strong> ({t.evidence_count}): {t.summary}</li>)}</ul>
            </>
          ) : null}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Table</th><th>Title</th><th>Date</th><th>Sentiment</th><th>Excerpt</th></tr></thead>
              <tbody>
                {notion.hits.map((h) => (
                  <tr key={h.page_id}>
                    <td>{SOURCE_LABEL[h.source] ?? h.source}</td>
                    <td>{h.url ? <a href={h.url} rel="noreferrer noopener" target="_blank">{h.title}</a> : h.title}</td>
                    <td>{h.date ?? "—"}</td>
                    <td>{h.sentiment ?? "—"}</td>
                    <td>{h.excerpt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="muted">Beary has no Notion dossier yet. Set NOTION_TOKEN (locally or as a Render secret) and run <code>pnpm beary:notion</code>.</p>
      )}

      {desk ? (
        <>
          <h2>Desk observations</h2>
          <p className="muted">
            {desk.desks.length} public desks · paraphrased from Notion rows · claims by public accounts, not measurements. Bison has not verified them.
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Desk</th><th>Topic</th><th>Claim</th></tr></thead>
              <tbody>
                {desk.observations.map((o) => (
                  <tr key={o.id}><td>{o.date ?? "—"}</td><td>{o.desk}</td><td>{o.topic}</td><td>{o.claim}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {latest ? (
        <>
          <h2>Week {latest.week} {latest.reconstructed ? "(reconstructed)" : "(live)"}</h2>
          <div className="stat-row">
            <div className="stat"><span>Sentiment index</span><strong>{latest.sentiment_index?.toFixed(2) ?? "—"}</strong></div>
            <div className="stat"><span>Verified posts</span><strong>{latest.post_count}</strong></div>
            <div className="stat"><span>Discarded</span><strong>{latest.discarded_count}</strong></div>
          </div>

          <h2>Narratives</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Topic</th><th>Posts</th><th>Average sentiment</th><th>Weight (credibility)</th></tr></thead>
              <tbody>{latest.narratives.map((n) => <tr key={n.topic}><td>{n.topic}</td><td>{n.posts}</td><td>{n.avg_sentiment.toFixed(2)}</td><td>{n.weight.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>

          <h2>Claims for Bison to verify</h2>
          <ul>{latest.claims_to_verify.map((c) => <li key={c.post_id}><a href={c.url} rel="noreferrer noopener" target="_blank">{c.paraphrase}</a> <span className="muted">· {c.topic}</span></li>)}</ul>
        </>
      ) : (
        <p>Beary has no analyzed weeks yet.</p>
      )}

      <h2>Highest-credibility posts</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Account</th><th>Tier</th><th>Paraphrase</th><th>Credibility</th><th>Sentiment</th></tr></thead>
          <tbody>
            {latest_posts.map((p) => (
              <tr key={p.post_id}>
                <td><a href={p.url} rel="noreferrer noopener" target="_blank">@{p.handle}</a></td>
                <td>{p.tier}</td>
                <td>{p.paraphrase}</td>
                <td>{p.credibility.toFixed(2)}</td>
                <td>{p.sentiment.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Why posts were discarded</h2>
      <ul>{Object.entries(discard_reasons).map(([k, n]) => <li key={k}>{REASON[k] ?? k}: {n}</li>)}</ul>
    </section>
  );
}
