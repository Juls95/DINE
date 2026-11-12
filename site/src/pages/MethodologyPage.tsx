import { PARAMS } from "../../../src/bul/params";
import { SCORING } from "../../../src/beary/score";

export function MethodologyPage() {
  return (
    <section className="page">
      <header className="page-head">
        <h1>Metodología</h1>
        <p>Cómo se obtienen y se combinan los datos, qué parámetros se fijaron antes de ver los resultados y qué no se puede medir.</p>
      </header>

      <h2>Fuentes</h2>
      <ul>
        <li><strong>Bison · BigQuery:</strong> <code>bigquery-public-data.crypto_near_mainnet_us</code>, tablas <code>blocks</code>, <code>transactions</code> y <code>receipt_actions</code>. Toda query filtra por <code>block_date</code> y pasa por un dry run con tope de bytes.</li>
        <li><strong>Bison · Intents Explorer:</strong> <code>GET /api/v0/transactions</code>, solo swaps 1Click con estado SUCCESS, con JWT del Partner Dashboard y una solicitud cada cinco segundos.</li>
        <li><strong>Beary · xAI:</strong> Responses API con la herramienta <code>x_search</code>, limitada a una lista fija de cuentas y a un día por consulta.</li>
      </ul>

      <h2>Cómo leer la tesis</h2>
      <ul>
        <li><strong>Régimen:</strong> dirección sin timing; compara la mediana de treinta días de cuentas activas contra la de noventa.</li>
        <li><strong>Confirmadores:</strong> una subida de sentimiento sin actividad es un espejismo.</li>
        <li><strong>Pico frente a cambio estructural:</strong> un salto que no persiste o está concentrado en pocos signers no cuenta como adopción.</li>
        <li><strong>Invalidación explícita:</strong> la tesis dice de antemano qué resultado la haría cambiar.</li>
      </ul>

      <h2>Parámetros pre-registrados</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Parámetro</th><th>Valor</th></tr></thead>
          <tbody>{Object.entries(PARAMS).map(([k, v]) => <tr key={k}><td><code>{k}</code></td><td>{v}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>Puntaje de credibilidad de Beary</h2>
      <p className="muted">Se calcula en código, no lo decide el modelo. Resultado acotado entre cero y uno.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Componente</th><th>Valor</th></tr></thead>
          <tbody>
            {Object.entries(SCORING.tier).map(([k, v]) => <tr key={k}><td>Nivel de cuenta: {k}</td><td>{v}</td></tr>)}
            <tr><td>Enlaza a fuente primaria</td><td>+{SCORING.primarySourceBonus}</td></tr>
            <tr><td>Por cada cuenta independiente que corrobora (máx. {SCORING.corroborationMaxHandles})</td><td>+{SCORING.corroborationBonusPerHandle}</td></tr>
            <tr><td>Promoción</td><td>−{SCORING.promoPenalty}</td></tr>
            <tr><td>Cifra sin fuente</td><td>−{SCORING.unsourcedNumberPenalty}</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Límites</h2>
      <ul>
        <li>Sin precio, capitalización, TVL ni fees en USD: no hay fuente aprobada para eso.</li>
        <li>1Click Swap no equivale a todo NEAR Intents.</li>
        <li>Cuentas no son personas; los relayers distorsionan el conteo.</li>
        <li>La correlación con rezago no demuestra causalidad.</li>
      </ul>
    </section>
  );
}
