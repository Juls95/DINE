import { addDays, weekStart } from "../lib/dates";
import { PARAMS, SUCCESS_STATUS_PREFIX } from "./params";
import { laggedCorrelation, logDiff, mean, median, movingAverage, pctChange, sum } from "./stats";
import { registerDesk } from "./desk";
import { EXTERNAL_FIGURES, EXTERNAL_NOTE, EXTERNAL_REFERENCES, externalValues } from "./external";
import type { Inputs } from "./load";
import { computeTechnical, registerTechnical } from "./technical";
import type { Analysis, Divergence, LagPoint, Metric, Provenance, SpikeEvent } from "./types";

const W = PARAMS.window_days;
export const round = (n: number | null, d = 4) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d);

/** Rows in [end - offset - W, end - offset). */
function windowRows<T extends { date: string }>(rows: readonly T[], end: string, offset = 0): T[] {
  const to = addDays(end, -offset);
  const from = addDays(to, -W);
  return rows.filter((r) => r.date >= from && r.date < to);
}

export function classifySpikes(inputs: Inputs): SpikeEvent[] {
  const daa = inputs.bison.daily_activity;
  const conc = new Map(inputs.bison.concentration.map((c) => [c.date, c]));
  const events: SpikeEvent[] = [];
  for (let i = W; i < daa.length; i++) {
    const row = daa[i];
    if (!row) continue;
    const baseline = median(daa.slice(i - W, i).map((r) => r.daily_active_accounts));
    if (!baseline) continue;
    const multiple = row.daily_active_accounts / baseline;
    if (multiple < PARAMS.spike_multiple) continue;
    const after = daa.slice(i + 1, i + 1 + PARAMS.spike_persistence_days).map((r) => r.daily_active_accounts);
    const afterMedian = median(after);
    const c = conc.get(row.date);
    const top10 = c && c.total_transactions > 0 ? (c.top10_transactions / c.total_transactions) * 100 : 0;
    const persisted = afterMedian !== null && after.length === PARAMS.spike_persistence_days && afterMedian >= baseline * PARAMS.spike_persistence_multiple;
    events.push({
      date: row.date,
      multiple: round(multiple, 2) as number,
      top10_share_pct: round(top10, 1) as number,
      classification: persisted && top10 < PARAMS.spike_concentration_pct ? "structural_change" : "spike",
    });
  }
  return events;
}

/** Daily lag analysis on growth rates of smoothed series: does 1Click activity lead daily active accounts? */
export function lagAnalysis(inputs: Inputs): LagPoint[] {
  const intents = new Map(inputs.bison.intents_daily.map((r) => [r.date, r.swaps]));
  const days = inputs.bison.daily_activity.filter((r) => intents.has(r.date));
  const s = PARAMS.lag_smoothing_days;
  const x = logDiff(movingAverage(days.map((d) => intents.get(d.date) ?? 0), s), s);
  const y = logDiff(movingAverage(days.map((d) => d.daily_active_accounts), s), s);
  const out: LagPoint[] = [];
  for (let lag = 0; lag <= PARAMS.lag_max_days; lag++) {
    const f = laggedCorrelation(x, y, lag);
    const r = laggedCorrelation(y, x, lag);
    out.push({ lag, forward: round(f.r, 3), reverse: round(r.r, 3), n: f.n });
  }
  return out;
}

export function divergences(inputs: Inputs): Divergence[] {
  const daaByWeek = new Map<string, number[]>();
  for (const r of inputs.bison.daily_activity) {
    const wk = weekStart(r.date);
    daaByWeek.set(wk, [...(daaByWeek.get(wk) ?? []), r.daily_active_accounts]);
  }
  const weeks = [...inputs.bearyWeekly].sort((a, b) => a.from.localeCompare(b.from));
  return weeks.map((w, i) => {
    const prev = weeks[i - 1];
    const cur = daaByWeek.get(w.from) ?? [];
    const before = daaByWeek.get(addDays(w.from, -7)) ?? [];
    const onchain = cur.length === 7 && before.length === 7 ? pctChange(mean(cur), mean(before)) : null;
    const sDelta = w.sentiment_index !== null && prev?.sentiment_index != null ? w.sentiment_index - prev.sentiment_index : null;
    let quadrant: Divergence["quadrant"] = "no data";
    if (onchain !== null && sDelta !== null) {
      const up = onchain > PARAMS.divergence_onchain_band_pct;
      const down = onchain < -PARAMS.divergence_onchain_band_pct;
      const sUp = sDelta > PARAMS.divergence_sentiment_band;
      const sDown = sDelta < -PARAMS.divergence_sentiment_band;
      if (sUp && up) quadrant = "confirmation";
      else if (sUp) quadrant = "mirage";
      else if (sDown && up) quadrant = "unnarrated opportunity";
      else if (sDown && down) quadrant = "confirmed deterioration";
      else quadrant = "neutral";
    }
    return {
      week: w.week, from: w.from, reconstructed: w.reconstructed, sentiment_index: w.sentiment_index,
      sentiment_delta: round(sDelta, 3), onchain_change_pct: round(onchain, 2), quadrant,
    };
  });
}

/** Collects metrics with a shared provenance rule: simulated pipeline inputs are never labelled "computed". */
export function metricAdder(store: Record<string, Metric>, mode: Inputs["mode"]) {
  return (id: string, label: string, value: number | null, unit: Metric["unit"], source: string, note?: string, provenance?: Provenance) => {
    store[id] = {
      id, label, value: round(value), unit, source,
      provenance: provenance ?? (mode === "mock" ? "simulated" : "computed"),
      ...(note ? { note } : {}),
    };
  };
}

export function analyze(inputs: Inputs, generatedAt: string): Analysis {
  const { bison, manifest } = inputs;
  const end = manifest.window.end;
  const m: Record<string, Metric> = {};
  const add = metricAdder(m, inputs.mode);
  const BQ = "BigQuery crypto_near_mainnet_us";
  const IE = "Intents Explorer (1Click Swap)";

  const daa = (o: number) => windowRows(bison.daily_activity, end, o).map((r) => r.daily_active_accounts);
  const daa30 = median(daa(0));
  const daaPrev = median(daa(W));
  const daa90 = median(bison.daily_activity.filter((r) => r.date >= addDays(end, -90)).map((r) => r.daily_active_accounts));
  add("daa_median_30d", "Median daily active accounts (last 30 days)", daa30, "count", `${BQ} · transactions`);
  add("daa_median_prev_30d", "Median daily active accounts (previous 30 days)", daaPrev, "count", `${BQ} · transactions`);
  add("daa_median_90d", "Median daily active accounts (90 days)", daa90, "count", `${BQ} · transactions`);
  add("daa_30d_change_pct", "Change in median active accounts vs previous 30 days", pctChange(daa30, daaPrev), "pct", `${BQ} · transactions`);
  const regimeGap = pctChange(daa30, daa90);
  add("daa_30d_vs_90d_pct", "30-day median vs 90-day median", regimeGap, "pct", `${BQ} · transactions`);

  const tx = (o: number) => windowRows(bison.daily_activity, end, o).map((r) => r.transactions);
  add("tx_median_30d", "Median daily transactions (30 days)", median(tx(0)), "count", `${BQ} · transactions`);
  add("tx_30d_change_pct", "Change in median transactions vs previous 30 days", pctChange(median(tx(0)), median(tx(W))), "pct", `${BQ} · transactions`);

  const status = windowRows(bison.tx_status, end);
  const ok = sum(status.filter((s) => s.status.toUpperCase().startsWith(SUCCESS_STATUS_PREFIX)).map((s) => s.transactions));
  const all = sum(status.map((s) => s.transactions));
  add("success_rate_30d", "Successful transactions (30 days)", all ? (ok / all) * 100 : null, "pct", `${BQ} · transactions.status`,
    "The status-to-success mapping must be checked against the real values of status.");

  const acc = (o: number) => sum(windowRows(bison.new_accounts, end, o).map((r) => r.new_accounts));
  add("new_accounts_30d", "Accounts created (30 days)", acc(0), "count", `${BQ} · receipt_actions`);
  add("new_accounts_30d_change_pct", "Change in accounts created vs previous 30 days", pctChange(acc(0), acc(W)), "pct", `${BQ} · receipt_actions`);

  const ca = (o: number) => windowRows(bison.contract_activity, end, o);
  const share = (rows: ReturnType<typeof ca>) => {
    const calls = sum(rows.map((r) => r.function_calls));
    return calls ? (sum(rows.map((r) => r.intents_calls)) / calls) * 100 : null;
  };
  const share30 = share(ca(0));
  const sharePrev = share(ca(W));
  add("active_contracts_median_30d", "Median active contracts per day (30 days)", median(ca(0).map((r) => r.active_contracts)), "count", `${BQ} · receipt_actions`);
  add("deploys_30d", "Contracts deployed (30 days)", sum(ca(0).map((r) => r.deploys)), "count", `${BQ} · receipt_actions`);
  add("intents_call_share_30d", "Intents contract share of all contract calls (30 days)", share30, "pct", `${BQ} · receipt_actions`);
  add("intents_call_share_change_pp", "Change in that share vs previous 30 days", share30 !== null && sharePrev !== null ? share30 - sharePrev : null, "pp", `${BQ} · receipt_actions`);

  const conc = windowRows(bison.concentration, end).map((c) => (c.total_transactions ? (c.top10_transactions / c.total_transactions) * 100 : 0));
  add("top10_share_median_30d", "Median share of transactions from the ten most active signers (30 days)", median(conc), "pct", `${BQ} · transactions`);

  const meta = windowRows(bison.meta_tx, end);
  const metaActions = sum(meta.map((r) => r.total_actions));
  add("meta_tx_share_30d", "Delegated actions (meta-transactions) share of all actions (30 days)", metaActions ? (sum(meta.map((r) => r.delegate_actions)) / metaActions) * 100 : null, "pct", `${BQ} · receipt_actions`);
  add("delegating_accounts_median_30d", "Median accounts using meta-transactions per day", median(meta.map((r) => r.delegating_accounts)), "count", `${BQ} · receipt_actions`);

  const ie = (o: number) => windowRows(bison.intents_daily, end, o);
  const vol30 = sum(ie(0).map((r) => r.volume_usd));
  const volPrev = sum(ie(W).map((r) => r.volume_usd));
  const swaps30 = sum(ie(0).map((r) => r.swaps));
  add("intents_volume_30d_usd", "1Click Swap volume (30 days)", ie(0).length ? vol30 : null, "usd", IE);
  add("intents_volume_30d_change_pct", "Change in 1Click volume vs previous 30 days", ie(W).length ? pctChange(vol30, volPrev) : null, "pct", IE);
  add("intents_swaps_30d", "1Click swaps (30 days)", ie(0).length ? swaps30 : null, "count", IE);
  add("intents_cross_chain_share_30d", "Swaps between different chains (30 days, heuristic on asset id)", swaps30 ? (sum(ie(0).map((r) => r.cross_chain_swaps)) / swaps30) * 100 : null, "pct", IE);
  add("intents_missing_usd_30d", "Swaps without a reported USD value (30 days)", ie(0).length ? sum(ie(0).map((r) => r.swaps_missing_usd)) : null, "count", IE);

  const swapsPer1k = daa30 && ie(0).length ? (swaps30 / (daa30 * W)) * 1000 : null;
  add("swaps_per_1k_daa", "1Click swaps per thousand daily active accounts (30 days)", swapsPer1k, "ratio", `${IE} + ${BQ}`,
    "An engagement-to-activity ratio, not a conversion rate: addresses are not joined.");

  const volChange = m.intents_volume_30d_change_pct?.value ?? null;
  const daaChange = m.daa_30d_change_pct?.value ?? null;
  add("growth_gap_pp", "1Click volume growth minus active-account growth", volChange !== null && daaChange !== null ? volChange - daaChange : null, "pp", `${IE} + ${BQ}`);

  const lag = lagAnalysis(inputs);
  const best = lag.filter((p) => p.lag > 0 && p.forward !== null).sort((a, b) => (b.forward ?? 0) - (a.forward ?? 0))[0];
  const bestReverse = lag.filter((p) => p.lag > 0 && p.reverse !== null).sort((a, b) => (b.reverse ?? 0) - (a.reverse ?? 0))[0];
  add("lag_best_days", "Lag with the highest correlation (1Click to active accounts)", best?.lag ?? null, "days", `${IE} + ${BQ}`);
  add("lag_best_r", "Correlation at that lag", best?.forward ?? null, "corr", `${IE} + ${BQ}`);
  add("lag_best_n", "Day pairs used in the correlation", best?.n ?? null, "count", `${IE} + ${BQ}`);
  add("lag_reverse_best_r", "Best reverse correlation (active accounts to 1Click)", bestReverse?.reverse ?? null, "corr", `${IE} + ${BQ}`);
  add("lag_zero_r", "Correlation with no lag", lag[0]?.forward ?? null, "corr", `${IE} + ${BQ}`);

  const spikes = classifySpikes(inputs);
  add("spikes_total", "Days with an active-account jump above the threshold", spikes.length, "count", `${BQ} · transactions`);
  add("spikes_nonstructural", "Jumps classified as spikes (not structural)", spikes.filter((s) => s.classification === "spike").length, "count", `${BQ} · transactions`);

  const weeks = [...inputs.bearyWeekly].sort((a, b) => a.from.localeCompare(b.from));
  const last = weeks.at(-1);
  const prev = weeks.at(-2);
  add("sentiment_index_last_week", "Credibility-weighted sentiment index (last week)", last?.sentiment_index ?? null, "index", "Beary · xAI x_search");
  add("sentiment_index_prev_week", "Sentiment index (previous week)", prev?.sentiment_index ?? null, "index", "Beary · xAI x_search");
  add("beary_posts_last_week", "Verified posts (last week)", last?.post_count ?? null, "count", "Beary · xAI x_search");
  const kept = sum(inputs.bearyDaily.map((d) => d.posts.length));
  const dropped = sum(inputs.bearyDaily.map((d) => d.discarded.length));
  add("beary_discard_share", "Posts discarded by the citation, account or date checks", kept + dropped ? (dropped / (kept + dropped)) * 100 : null, "pct", "Beary · verification");
  add("beary_weeks", "Weeks analyzed by Beary", weeks.length, "count", "Beary");
  add("beary_weeks_reconstructed", "Weeks reconstructed (not run live)", weeks.filter((w) => w.reconstructed).length, "count", "Beary");

  const div = divergences(inputs);
  add("mirage_weeks", "Weeks flagged as a mirage", div.filter((d) => d.quadrant === "mirage").length, "count", "Bul · divergences");

  const regime =
    regimeGap === null ? "no data" : regimeGap > PARAMS.regime_band_pct ? "expansion" : regimeGap < -PARAMS.regime_band_pct ? "contraction" : "sideways";
  const shift = (m.intents_call_share_change_pp?.value ?? 0) > 0 && (m.growth_gap_pp?.value ?? 0) > 0;
  const leads = best !== undefined && (best.forward ?? 0) >= PARAMS.lag_min_r && (best.forward ?? 0) > (bestReverse?.reverse ?? 0);
  const verdict = shift && leads ? "supported by current data" : shift || leads ? "partially supported" : "not supported by current data";
  const strength = (r: number | null) => (r === null ? "no data" : Math.abs(r) < 0.3 ? "weak" : Math.abs(r) < 0.6 ? "moderate" : "strong");

  const technical = computeTechnical(inputs.price, regime);
  registerTechnical(technical, add, inputs.mode);
  const desk = registerDesk(inputs.desk, inputs.bearyNotion, externalValues(), add);
  for (const f of EXTERNAL_FIGURES) add(f.id, f.label, f.value, f.unit, "External reference thesis (relayed)", EXTERNAL_NOTE, "cited");

  const bias = technical.labels.technical_bias ?? "no data";
  const stance =
    verdict === "not supported by current data"
      ? "no edge: the on-chain claim is not supported"
      : verdict === "partially supported"
        ? "unproven: watch the tripwires"
        : bias === "constructive"
          ? "constructive: direction and timing align"
          : bias === "no data"
            ? "constructive on direction; timing cannot be read without price data"
            : "constructive on direction; timing is not confirmed";
  const sim = inputs.mode === "mock";
  const provenanceLabels: [string, string][] = [
    ["src_chain", sim ? "simulated" : "real (live)"],
    ["src_price", inputs.price ? (sim ? "simulated, scaled to a desk price print" : `real (${technical.source})`) : "not available"],
    ["src_notion", inputs.bearyNotion ? (sim ? "real rows, paraphrased sample" : "real (live)") : "not available"],
    ["src_desk", inputs.desk ? (sim ? "real notes, curated sample" : "real, curated") : "not available"],
    ["src_x", sim ? "simulated" : "real (reconstructed weeks are marked)"],
    ["ref_btc_date", EXTERNAL_REFERENCES.find((r) => r.id === "btc_alert")?.date ?? "unknown"],
  ];

  const labels = Object.fromEntries(
    [
      ...Object.entries(technical.labels),
      ...provenanceLabels,
      ["stance", stance],
      ["mode", inputs.mode === "mock" ? "SIMULATED (mock)" : "real data (live)"],
      ["generated_at", generatedAt.slice(0, 10)],
      ["last_block_date", manifest.freshness.last_block_date ?? "unknown"],
      ["window_start", manifest.window.start],
      ["window_end", manifest.window.end],
      ["regime", regime],
      ["hypothesis_verdict", verdict],
      ["shift_status", shift ? "observed" : "not observed"],
      ["lead_status", leads ? "observed" : "not observed"],
      ["lag_strength", strength(best?.forward ?? null)],
    ].map(([id, value]) => [id, { id: id as string, value: value as string }]),
  );

  return {
    mode: inputs.mode,
    generated_at: generatedAt,
    last_block_date: manifest.freshness.last_block_date,
    window: manifest.window,
    metrics: m,
    labels,
    spikes,
    divergences: div,
    lag,
    confluence: technical.confluence,
    npocs: technical.npocs,
    notion_themes: desk.themes,
    desk_observations: inputs.desk?.observations ?? [],
  };
}
