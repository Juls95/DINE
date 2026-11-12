import { PARAMS } from "./params";
import type { RenderContext } from "./render";
import type { Analysis, Metric } from "./types";

type Item = { stance: "for" | "against"; text: string };

const v = (a: Analysis, id: string) => a.metrics[id]?.value ?? null;

/** Evidence is selected by rules on the computed metrics; "against" is never empty, by design. */
export function selectEvidence(a: Analysis): Item[] {
  const items: Item[] = [];
  const share = v(a, "intents_call_share_change_pp");
  if (share !== null) {
    items.push(share > 0
      ? { stance: "for", text: "La participación del contrato de Intents en las llamadas a contratos cambió {{metric:intents_call_share_change_pp}} frente a los treinta días previos (hoy {{metric:intents_call_share_30d}})." }
      : { stance: "against", text: "La participación del contrato de Intents en las llamadas a contratos no sube: {{metric:intents_call_share_change_pp}} frente a los treinta días previos." });
  }
  const gap = v(a, "growth_gap_pp");
  if (gap !== null) {
    items.push(gap > 0
      ? { stance: "for", text: "El volumen de 1Click creció {{metric:intents_volume_30d_change_pct}} mientras las cuentas activas cambiaron {{metric:daa_30d_change_pct}}: la ejecución cross-chain crece más rápido que la base." }
      : { stance: "against", text: "El volumen de 1Click ({{metric:intents_volume_30d_change_pct}}) no crece más rápido que las cuentas activas ({{metric:daa_30d_change_pct}})." });
  }
  if (a.labels.lead_status?.value === "se observa") {
    items.push({ stance: "for", text: "El crecimiento de swaps de 1Click anticipa el de cuentas activas: la correlación máxima es {{metric:lag_best_r}} con un rezago de {{metric:lag_best_days}}, mayor que en sentido inverso ({{metric:lag_reverse_best_r}})." });
  } else {
    items.push({ stance: "against", text: "No hay anticipación clara: la mejor correlación con rezago es {{metric:lag_best_r}} y en sentido inverso {{metric:lag_reverse_best_r}} (umbral pre-registrado {{param:lag_min_r}})." });
  }
  const regime = a.labels.regime?.value;
  if (regime === "expansión") items.push({ stance: "for", text: "El régimen de adopción es de expansión: la mediana de treinta días de cuentas activas está {{metric:daa_30d_vs_90d_pct}} sobre la de noventa días." });
  else if (regime) items.push({ stance: "against", text: "El régimen de adopción es {{label:regime}}: la mediana de treinta días de cuentas activas está {{metric:daa_30d_vs_90d_pct}} frente a la de noventa días." });

  const conc = v(a, "top10_share_median_30d");
  if (conc !== null && conc >= PARAMS.spike_concentration_pct) {
    items.push({ stance: "against", text: "La actividad está concentrada: los diez signers más activos generan {{metric:top10_share_median_30d}} de las transacciones (mediana de treinta días)." });
  }
  if ((v(a, "spikes_pico") ?? 0) > 0) {
    items.push({ stance: "against", text: "Saltos de cuentas activas clasificados como pico (no persisten o están concentrados): {{metric:spikes_pico}}. No se cuentan como adopción." });
  }
  if ((v(a, "mirage_weeks") ?? 0) > 0) {
    items.push({ stance: "against", text: "Semanas de espejismo detectadas (el sentimiento subió sin que la actividad on-chain lo acompañara): {{metric:mirage_weeks}}." });
  }
  if ((v(a, "intents_missing_usd_30d") ?? 0) > 0) {
    items.push({ stance: "against", text: "{{metric:intents_missing_usd_30d}} swaps de los últimos treinta días no reportan valor en USD; el volumen está subestimado en esa medida." });
  }
  items.push(
    { stance: "against", text: "1Click Swap es solo una parte de NEAR Intents; el volumen total de Intents no se puede medir con estas fuentes." },
    { stance: "against", text: "La correlación usa {{metric:lag_best_n}} pares de días; una correlación con rezago no demuestra causalidad." },
  );
  if ((v(a, "beary_weeks_reconstructed") ?? 0) > 0) {
    items.push({ stance: "against", text: "{{metric:beary_weeks_reconstructed}} de {{metric:beary_weeks}} semanas de Beary son reconstruidas con búsqueda histórica, no corridas en vivo." });
  }
  return items;
}

/** Per-row values become metrics/labels so even tables obey the "numbers only from data" rule. */
export function buildContext(a: Analysis): RenderContext {
  const metrics: Record<string, Metric> = { ...a.metrics };
  const labels: Record<string, { value: string }> = { ...a.labels };
  const items = selectEvidence(a);
  const bullets = (stance: Item["stance"]) => items.filter((i) => i.stance === stance).map((i) => `- ${i.text}`).join("\n") || "- Ninguna con los datos actuales.";

  const divRows = a.divergences.map((d, i) => {
    labels[`div_${i}_week`] = { value: d.week };
    labels[`div_${i}_kind`] = { value: d.reconstructed ? "reconstruida" : "en vivo" };
    labels[`div_${i}_quadrant`] = { value: d.quadrant };
    metrics[`div_${i}_sent`] = { id: `div_${i}_sent`, label: "Sentimiento", value: d.sentiment_index, unit: "index", source: "Beary" };
    metrics[`div_${i}_chain`] = { id: `div_${i}_chain`, label: "Cambio semanal de cuentas activas", value: d.onchain_change_pct, unit: "pct", source: "Bison" };
    return `| {{label:div_${i}_week}} | {{label:div_${i}_kind}} | {{metric:div_${i}_sent}} | {{metric:div_${i}_chain}} | {{label:div_${i}_quadrant}} |`;
  });
  const divTable = divRows.length
    ? ["| Semana | Tipo | Sentimiento (Beary) | Cuentas activas semana contra semana (Bison) | Lectura de Bul |", "| --- | --- | --- | --- | --- |", ...divRows].join("\n")
    : "Sin semanas de Beary todavía.";

  const spikeRows = a.spikes.map((s, i) => {
    labels[`spike_${i}_date`] = { value: s.date };
    labels[`spike_${i}_class`] = { value: s.classification === "pico" ? "pico (no estructural)" : "cambio estructural" };
    metrics[`spike_${i}_top10`] = { id: `spike_${i}_top10`, label: "Top diez signers", value: s.top10_share_pct, unit: "pct", source: "Bison" };
    return `- {{label:spike_${i}_date}}: {{label:spike_${i}_class}}; los diez signers más activos generaron {{metric:spike_${i}_top10}} de las transacciones.`;
  });

  return {
    metrics,
    labels,
    blocks: {
      evidence_for: bullets("for"),
      evidence_against: bullets("against"),
      divergences: divTable,
      spikes: spikeRows.join("\n") || "- No hubo saltos sobre el umbral en la ventana.",
    },
  };
}
