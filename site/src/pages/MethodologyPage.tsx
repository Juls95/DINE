import { PARAMS } from "../../../src/bul/params";
import { SCORING } from "../../../src/beary/score";

export function MethodologyPage() {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Methodology</h1>
        <p>How data is obtained and combined, which parameters were fixed before seeing the results, and what cannot be measured.</p>
      </header>

      <h2>Sources</h2>
      <ul>
        <li><strong>Bison · BigQuery:</strong> <code>bigquery-public-data.crypto_near_mainnet_us</code>, tables <code>blocks</code>, <code>transactions</code> and <code>receipt_actions</code>. Every query filters by <code>block_date</code> and goes through a dry run with a byte cap.</li>
        <li><strong>Bison · Intents Explorer:</strong> <code>GET /api/v0/transactions</code>, 1Click swaps with status SUCCESS only, with a Partner Dashboard JWT and one request every five seconds.</li>
        <li><strong>Beary · Notion:</strong> TickersInfo, X Creative Output and X Account Analyses through <code>POST /v1/databases/{"{id}"}/query</code>. The token lives in <code>NOTION_TOKEN</code> (env / Render secret); table IDs are not secrets. Beary keeps NEAR rows, not the English words near or nearly.</li>
        <li><strong>Beary · xAI:</strong> Responses API with the <code>x_search</code> tool, limited to a fixed account list and one day per query.</li>
      </ul>

      <h2>How to read the thesis</h2>
      <ul>
        <li><strong>Regime:</strong> direction without timing; it compares the thirty-day median of active accounts against the ninety-day one.</li>
        <li><strong>Confirmers:</strong> a rise in sentiment without activity is a mirage.</li>
        <li><strong>Spike versus structural change:</strong> a jump that does not persist, or is concentrated in a few signers, does not count as adoption.</li>
        <li><strong>Explicit invalidation:</strong> the thesis says in advance which result would change it.</li>
      </ul>

      <h2>Pre-registered parameters</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>{Object.entries(PARAMS).map(([k, v]) => <tr key={k}><td><code>{k}</code></td><td>{v}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>Beary credibility score</h2>
      <p className="muted">Computed in code, not decided by the model. The result is bounded between zero and one.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Component</th><th>Value</th></tr></thead>
          <tbody>
            {Object.entries(SCORING.tier).map(([k, v]) => <tr key={k}><td>Account tier: {k}</td><td>{v}</td></tr>)}
            <tr><td>Links to a primary source</td><td>+{SCORING.primarySourceBonus}</td></tr>
            <tr><td>Per independent account that corroborates (max. {SCORING.corroborationMaxHandles})</td><td>+{SCORING.corroborationBonusPerHandle}</td></tr>
            <tr><td>Promotion</td><td>−{SCORING.promoPenalty}</td></tr>
            <tr><td>Unsourced figure</td><td>−{SCORING.unsourcedNumberPenalty}</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Limits</h2>
      <ul>
        <li>No price, market capitalization, TVL or USD fees: there is no approved source for them.</li>
        <li>1Click Swap is not all of NEAR Intents.</li>
        <li>Accounts are not people; relayers distort the count.</li>
        <li>A lagged correlation does not prove causality.</li>
      </ul>
    </section>
  );
}
