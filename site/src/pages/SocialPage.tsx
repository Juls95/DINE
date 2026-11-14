import type { Bundle } from "../lib/bundle";

const REASON: Record<string, string> = {
  not_in_citations: "No citado por xAI (posible alucinación)",
  handle_not_allowed: "Cuenta fuera de la lista",
  outside_date_window: "Fuera de la fecha consultada",
  invalid_shape: "Respuesta mal formada",
  duplicate: "Duplicado",
};

const SOURCE_LABEL: Record<string, string> = {
  tickers_info: "TickersInfo",
  x_creative_output: "X Creative Output",
  x_account_analyses: "X Account Analyses",
};

export function SocialPage({ bundle }: { bundle: Bundle }) {
  const { weeks, latest_posts, discard_reasons, notion } = bundle.beary;
  const latest = weeks.at(-1);
  return (
    <section className="page">
      <header className="page-head">
        <h1>Resumen social</h1>
        <p>
          Lo que Beary leyó en Notion y en X sobre NEAR. Las cifras que aparecen en posts o en las tablas nunca se usan como datos: se marcan como
          afirmaciones que Bison debe verificar.
        </p>
      </header>

      {notion ? (
        <>
          <h2>Expediente Notion · NEAR</h2>
          <p className="muted">
            {notion.generated_at.slice(0, 10)} · {notion.counts.tickers} TickersInfo · {notion.counts.creative} X Creative Output · {notion.counts.analyses} X Account Analyses · {notion.counts.discarded_false_positives} coincidencias falsas descartadas
          </p>
          <div className="stat-row">
            <div className="stat"><span>Positivo</span><strong>{notion.sentiment_tally.Positivo}</strong></div>
            <div className="stat"><span>Mixto</span><strong>{notion.sentiment_tally.Mixto}</strong></div>
            <div className="stat"><span>Neutral</span><strong>{notion.sentiment_tally.Neutral}</strong></div>
            <div className="stat"><span>Negativo</span><strong>{notion.sentiment_tally.Negativo}</strong></div>
          </div>
          {notion.paragraphs.map((p) => <p key={p.slice(0, 48)}>{p}</p>)}
          {notion.themes.length > 0 ? (
            <>
              <h3>Temas</h3>
              <ul>{notion.themes.map((t) => <li key={t.id}><strong>{t.title}</strong> ({t.evidence_count}): {t.summary}</li>)}</ul>
            </>
          ) : null}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tabla</th><th>Título</th><th>Fecha</th><th>Sentimiento</th><th>Extracto</th></tr></thead>
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
        <p className="muted">Beary todavía no tiene expediente Notion. Configura NOTION_TOKEN (local o secreto de Render) y corre <code>pnpm beary:notion</code>.</p>
      )}

      {latest ? (
        <>
          <h2>Semana {latest.week} {latest.reconstructed ? "(reconstruida)" : "(en vivo)"}</h2>
          <div className="stat-row">
            <div className="stat"><span>Índice de sentimiento</span><strong>{latest.sentiment_index?.toFixed(2) ?? "—"}</strong></div>
            <div className="stat"><span>Posts verificados</span><strong>{latest.post_count}</strong></div>
            <div className="stat"><span>Descartados</span><strong>{latest.discarded_count}</strong></div>
          </div>

          <h2>Narrativas</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tema</th><th>Posts</th><th>Sentimiento medio</th><th>Peso (credibilidad)</th></tr></thead>
              <tbody>{latest.narratives.map((n) => <tr key={n.topic}><td>{n.topic}</td><td>{n.posts}</td><td>{n.avg_sentiment.toFixed(2)}</td><td>{n.weight.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>

          <h2>Afirmaciones a verificar con Bison</h2>
          <ul>{latest.claims_to_verify.map((c) => <li key={c.post_id}><a href={c.url} rel="noreferrer noopener" target="_blank">{c.paraphrase}</a> <span className="muted">· {c.topic}</span></li>)}</ul>
        </>
      ) : (
        <p>Beary todavía no tiene semanas analizadas.</p>
      )}

      <h2>Posts con mayor credibilidad</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Cuenta</th><th>Nivel</th><th>Paráfrasis</th><th>Credibilidad</th><th>Sentimiento</th></tr></thead>
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

      <h2>Por qué se descartaron posts</h2>
      <ul>{Object.entries(discard_reasons).map(([k, n]) => <li key={k}>{REASON[k] ?? k}: {n}</li>)}</ul>
    </section>
  );
}
