import type { Bundle } from "../lib/bundle";

const REASON: Record<string, string> = {
  not_in_citations: "No citado por xAI (posible alucinación)",
  handle_not_allowed: "Cuenta fuera de la lista",
  outside_date_window: "Fuera de la fecha consultada",
  invalid_shape: "Respuesta mal formada",
  duplicate: "Duplicado",
};

export function SocialPage({ bundle }: { bundle: Bundle }) {
  const { weeks, latest_posts, discard_reasons } = bundle.beary;
  const latest = weeks.at(-1);
  return (
    <section className="page">
      <header className="page-head">
        <h1>Resumen social</h1>
        <p>
          Lo que Beary leyó en X sobre NEAR. Las cifras que aparecen en posts nunca se usan como datos: se marcan como afirmaciones que Bison debe
          verificar.
        </p>
      </header>

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
