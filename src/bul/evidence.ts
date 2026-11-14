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
      ? { stance: "for", text: "The Intents contract share of contract calls changed {{metric:intents_call_share_change_pp}} against the previous thirty days (now {{metric:intents_call_share_30d}})." }
      : { stance: "against", text: "The Intents contract share of contract calls is not rising: {{metric:intents_call_share_change_pp}} against the previous thirty days." });
  }
  const gap = v(a, "growth_gap_pp");
  if (gap !== null) {
    items.push(gap > 0
      ? { stance: "for", text: "1Click volume grew {{metric:intents_volume_30d_change_pct}} while active accounts changed {{metric:daa_30d_change_pct}}: cross-chain execution is growing faster than the base." }
      : { stance: "against", text: "1Click volume ({{metric:intents_volume_30d_change_pct}}) is not growing faster than active accounts ({{metric:daa_30d_change_pct}})." });
  }
  if (a.labels.lead_status?.value === "observed") {
    items.push({ stance: "for", text: "1Click swap growth leads active-account growth: the peak correlation is {{metric:lag_best_r}} at a lag of {{metric:lag_best_days}}, higher than in the reverse direction ({{metric:lag_reverse_best_r}})." });
  } else {
    items.push({ stance: "against", text: "There is no clear lead: the best lagged correlation is {{metric:lag_best_r}} and the reverse is {{metric:lag_reverse_best_r}} (pre-registered threshold {{param:lag_min_r}})." });
  }
  const regime = a.labels.regime?.value;
  if (regime === "expansion") items.push({ stance: "for", text: "The adoption regime is expansion: the thirty-day median of active accounts is {{metric:daa_30d_vs_90d_pct}} above the ninety-day median." });
  else if (regime) items.push({ stance: "against", text: "The adoption regime is {{label:regime}}: the thirty-day median of active accounts is {{metric:daa_30d_vs_90d_pct}} against the ninety-day median." });

  const conc = v(a, "top10_share_median_30d");
  if (conc !== null && conc >= PARAMS.spike_concentration_pct) {
    items.push({ stance: "against", text: "Activity is concentrated: the ten most active signers generate {{metric:top10_share_median_30d}} of transactions (thirty-day median)." });
  }
  if ((v(a, "spikes_nonstructural") ?? 0) > 0) {
    items.push({ stance: "against", text: "Active-account jumps classified as spikes (they do not persist or are concentrated): {{metric:spikes_nonstructural}}. They are not counted as adoption." });
  }
  if ((v(a, "mirage_weeks") ?? 0) > 0) {
    items.push({ stance: "against", text: "Mirage weeks detected (sentiment rose without on-chain activity following): {{metric:mirage_weeks}}." });
  }
  if ((v(a, "intents_missing_usd_30d") ?? 0) > 0) {
    items.push({ stance: "against", text: "{{metric:intents_missing_usd_30d}} swaps in the last thirty days report no USD value; volume is understated by that much." });
  }
  items.push(
    { stance: "against", text: "1Click Swap is only one part of NEAR Intents; total Intents volume cannot be measured with these sources." },
    { stance: "against", text: "The correlation uses {{metric:lag_best_n}} day pairs; a lagged correlation does not prove causality." },
  );
  if ((v(a, "beary_weeks_reconstructed") ?? 0) > 0) {
    items.push({ stance: "against", text: "{{metric:beary_weeks_reconstructed}} of {{metric:beary_weeks}} Beary weeks are reconstructed from historical search, not run live." });
  }
  return items;
}

/** Per-row values become metrics/labels so even tables obey the "numbers only from data" rule. */
export function buildContext(a: Analysis): RenderContext {
  const metrics: Record<string, Metric> = { ...a.metrics };
  const labels: Record<string, { value: string }> = { ...a.labels };
  const items = selectEvidence(a);
  const bullets = (stance: Item["stance"]) => items.filter((i) => i.stance === stance).map((i) => `- ${i.text}`).join("\n") || "- None with the current data.";

  const divRows = a.divergences.map((d, i) => {
    labels[`div_${i}_week`] = { value: d.week };
    labels[`div_${i}_kind`] = { value: d.reconstructed ? "reconstructed" : "live" };
    labels[`div_${i}_quadrant`] = { value: d.quadrant };
    metrics[`div_${i}_sent`] = { id: `div_${i}_sent`, label: "Sentiment", value: d.sentiment_index, unit: "index", source: "Beary" };
    metrics[`div_${i}_chain`] = { id: `div_${i}_chain`, label: "Weekly change in active accounts", value: d.onchain_change_pct, unit: "pct", source: "Bison" };
    return `| {{label:div_${i}_week}} | {{label:div_${i}_kind}} | {{metric:div_${i}_sent}} | {{metric:div_${i}_chain}} | {{label:div_${i}_quadrant}} |`;
  });
  const divTable = divRows.length
    ? ["| Week | Type | Sentiment (Beary) | Week-over-week active accounts (Bison) | Bul reading |", "| --- | --- | --- | --- | --- |", ...divRows].join("\n")
    : "No Beary weeks yet.";

  const spikeRows = a.spikes.map((s, i) => {
    labels[`spike_${i}_date`] = { value: s.date };
    labels[`spike_${i}_class`] = { value: s.classification === "spike" ? "spike (not structural)" : "structural change" };
    metrics[`spike_${i}_top10`] = { id: `spike_${i}_top10`, label: "Top ten signers", value: s.top10_share_pct, unit: "pct", source: "Bison" };
    return `- {{label:spike_${i}_date}}: {{label:spike_${i}_class}}; the ten most active signers produced {{metric:spike_${i}_top10}} of transactions.`;
  });

  return {
    metrics,
    labels,
    blocks: {
      evidence_for: bullets("for"),
      evidence_against: bullets("against"),
      divergences: divTable,
      spikes: spikeRows.join("\n") || "- No jumps above the threshold in the window.",
    },
  };
}
