import { addDays, weekStart } from "../lib/dates";
import { PARAMS, SUCCESS_STATUS_PREFIX } from "./params";
import { laggedCorrelation, logDiff, mean, median, movingAverage, pctChange, sum } from "./stats";
import type { Inputs } from "./load";
import type { Analysis, Divergence, LagPoint, Metric, SpikeEvent } from "./types";

const W = PARAMS.window_days;
const round = (n: number | null, d = 4) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d);

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
      classification: persisted && top10 < PARAMS.spike_concentration_pct ? "cambio_estructural" : "pico",
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
    let quadrant: Divergence["quadrant"] = "sin datos";
    if (onchain !== null && sDelta !== null) {
      const up = onchain > PARAMS.divergence_onchain_band_pct;
      const down = onchain < -PARAMS.divergence_onchain_band_pct;
      const sUp = sDelta > PARAMS.divergence_sentiment_band;
      const sDown = sDelta < -PARAMS.divergence_sentiment_band;
      if (sUp && up) quadrant = "confirmación";
      else if (sUp) quadrant = "espejismo";
      else if (sDown && up) quadrant = "oportunidad no narrada";
      else if (sDown && down) quadrant = "deterioro confirmado";
      else quadrant = "neutral";
    }
    return {
      week: w.week, from: w.from, reconstructed: w.reconstructed, sentiment_index: w.sentiment_index,
      sentiment_delta: round(sDelta, 3), onchain_change_pct: round(onchain, 2), quadrant,
    };
  });
}

export function analyze(inputs: Inputs, generatedAt: string): Analysis {
  const { bison, manifest } = inputs;
  const end = manifest.window.end;
  const m: Record<string, Metric> = {};
  const add = (id: string, label: string, value: number | null, unit: Metric["unit"], source: string, note?: string) => {
    m[id] = { id, label, value: round(value), unit, source, ...(note ? { note } : {}) };
  };
  const BQ = "BigQuery crypto_near_mainnet_us";
  const IE = "Intents Explorer (1Click Swap)";

  const daa = (o: number) => windowRows(bison.daily_activity, end, o).map((r) => r.daily_active_accounts);
  const daa30 = median(daa(0));
  const daaPrev = median(daa(W));
  const daa90 = median(bison.daily_activity.filter((r) => r.date >= addDays(end, -90)).map((r) => r.daily_active_accounts));
  add("daa_median_30d", "Mediana de cuentas activas diarias (últimos 30 días)", daa30, "count", `${BQ} · transactions`);
  add("daa_median_prev_30d", "Mediana de cuentas activas diarias (30 días previos)", daaPrev, "count", `${BQ} · transactions`);
  add("daa_median_90d", "Mediana de cuentas activas diarias (90 días)", daa90, "count", `${BQ} · transactions`);
  add("daa_30d_change_pct", "Cambio de la mediana de cuentas activas vs 30 días previos", pctChange(daa30, daaPrev), "pct", `${BQ} · transactions`);
  const regimeGap = pctChange(daa30, daa90);
  add("daa_30d_vs_90d_pct", "Mediana 30 días vs mediana 90 días", regimeGap, "pct", `${BQ} · transactions`);

  const tx = (o: number) => windowRows(bison.daily_activity, end, o).map((r) => r.transactions);
  add("tx_median_30d", "Mediana de transacciones diarias (30 días)", median(tx(0)), "count", `${BQ} · transactions`);
  add("tx_30d_change_pct", "Cambio de la mediana de transacciones vs 30 días previos", pctChange(median(tx(0)), median(tx(W))), "pct", `${BQ} · transactions`);

  const status = windowRows(bison.tx_status, end);
  const ok = sum(status.filter((s) => s.status.toUpperCase().startsWith(SUCCESS_STATUS_PREFIX)).map((s) => s.transactions));
  const all = sum(status.map((s) => s.transactions));
  add("success_rate_30d", "Transacciones exitosas (30 días)", all ? (ok / all) * 100 : null, "pct", `${BQ} · transactions.status`,
    "El mapeo de estados a 'éxito' debe verificarse contra los valores reales de status.");

  const acc = (o: number) => sum(windowRows(bison.new_accounts, end, o).map((r) => r.new_accounts));
  add("new_accounts_30d", "Cuentas creadas (30 días)", acc(0), "count", `${BQ} · receipt_actions`);
  add("new_accounts_30d_change_pct", "Cambio de cuentas creadas vs 30 días previos", pctChange(acc(0), acc(W)), "pct", `${BQ} · receipt_actions`);

  const ca = (o: number) => windowRows(bison.contract_activity, end, o);
  const share = (rows: ReturnType<typeof ca>) => {
    const calls = sum(rows.map((r) => r.function_calls));
    return calls ? (sum(rows.map((r) => r.intents_calls)) / calls) * 100 : null;
  };
  const share30 = share(ca(0));
  const sharePrev = share(ca(W));
  add("active_contracts_median_30d", "Mediana de contratos activos por día (30 días)", median(ca(0).map((r) => r.active_contracts)), "count", `${BQ} · receipt_actions`);
  add("deploys_30d", "Contratos desplegados (30 días)", sum(ca(0).map((r) => r.deploys)), "count", `${BQ} · receipt_actions`);
  add("intents_call_share_30d", "Llamadas al contrato de Intents sobre el total de llamadas (30 días)", share30, "pct", `${BQ} · receipt_actions`);
  add("intents_call_share_change_pp", "Cambio de esa participación vs 30 días previos", share30 !== null && sharePrev !== null ? share30 - sharePrev : null, "pp", `${BQ} · receipt_actions`);

  const conc = windowRows(bison.concentration, end).map((c) => (c.total_transactions ? (c.top10_transactions / c.total_transactions) * 100 : 0));
  add("top10_share_median_30d", "Mediana de la participación de los diez signers más activos (30 días)", median(conc), "pct", `${BQ} · transactions`);

  const meta = windowRows(bison.meta_tx, end);
  const metaActions = sum(meta.map((r) => r.total_actions));
  add("meta_tx_share_30d", "Acciones delegadas (meta-transacciones) sobre el total (30 días)", metaActions ? (sum(meta.map((r) => r.delegate_actions)) / metaActions) * 100 : null, "pct", `${BQ} · receipt_actions`);
  add("delegating_accounts_median_30d", "Mediana de cuentas que usan meta-transacciones por día", median(meta.map((r) => r.delegating_accounts)), "count", `${BQ} · receipt_actions`);

  const ie = (o: number) => windowRows(bison.intents_daily, end, o);
  const vol30 = sum(ie(0).map((r) => r.volume_usd));
  const volPrev = sum(ie(W).map((r) => r.volume_usd));
  const swaps30 = sum(ie(0).map((r) => r.swaps));
  add("intents_volume_30d_usd", "Volumen de 1Click Swap (30 días)", ie(0).length ? vol30 : null, "usd", IE);
  add("intents_volume_30d_change_pct", "Cambio del volumen de 1Click vs 30 días previos", ie(W).length ? pctChange(vol30, volPrev) : null, "pct", IE);
  add("intents_swaps_30d", "Swaps de 1Click (30 días)", ie(0).length ? swaps30 : null, "count", IE);
  add("intents_cross_chain_share_30d", "Swaps entre cadenas distintas (30 días, heurística por id de activo)", swaps30 ? (sum(ie(0).map((r) => r.cross_chain_swaps)) / swaps30) * 100 : null, "pct", IE);
  add("intents_missing_usd_30d", "Swaps sin valor USD reportado (30 días)", ie(0).length ? sum(ie(0).map((r) => r.swaps_missing_usd)) : null, "count", IE);

  const volChange = m.intents_volume_30d_change_pct?.value ?? null;
  const daaChange = m.daa_30d_change_pct?.value ?? null;
  add("growth_gap_pp", "Crecimiento del volumen de 1Click menos crecimiento de cuentas activas", volChange !== null && daaChange !== null ? volChange - daaChange : null, "pp", `${IE} + ${BQ}`);

  const lag = lagAnalysis(inputs);
  const best = lag.filter((p) => p.lag > 0 && p.forward !== null).sort((a, b) => (b.forward ?? 0) - (a.forward ?? 0))[0];
  const bestReverse = lag.filter((p) => p.lag > 0 && p.reverse !== null).sort((a, b) => (b.reverse ?? 0) - (a.reverse ?? 0))[0];
  add("lag_best_days", "Rezago con mayor correlación (1Click → cuentas activas)", best?.lag ?? null, "days", `${IE} + ${BQ}`);
  add("lag_best_r", "Correlación en ese rezago", best?.forward ?? null, "corr", `${IE} + ${BQ}`);
  add("lag_best_n", "Pares de días usados en la correlación", best?.n ?? null, "count", `${IE} + ${BQ}`);
  add("lag_reverse_best_r", "Mejor correlación en sentido inverso (cuentas activas → 1Click)", bestReverse?.reverse ?? null, "corr", `${IE} + ${BQ}`);
  add("lag_zero_r", "Correlación sin rezago", lag[0]?.forward ?? null, "corr", `${IE} + ${BQ}`);

  const spikes = classifySpikes(inputs);
  add("spikes_total", "Días con salto de cuentas activas sobre el umbral", spikes.length, "count", `${BQ} · transactions`);
  add("spikes_pico", "Saltos clasificados como pico (no estructurales)", spikes.filter((s) => s.classification === "pico").length, "count", `${BQ} · transactions`);

  const weeks = [...inputs.bearyWeekly].sort((a, b) => a.from.localeCompare(b.from));
  const last = weeks.at(-1);
  const prev = weeks.at(-2);
  add("sentiment_index_last_week", "Índice de sentimiento ponderado por credibilidad (última semana)", last?.sentiment_index ?? null, "index", "Beary · xAI x_search");
  add("sentiment_index_prev_week", "Índice de sentimiento (semana previa)", prev?.sentiment_index ?? null, "index", "Beary · xAI x_search");
  add("beary_posts_last_week", "Posts verificados (última semana)", last?.post_count ?? null, "count", "Beary · xAI x_search");
  const kept = sum(inputs.bearyDaily.map((d) => d.posts.length));
  const dropped = sum(inputs.bearyDaily.map((d) => d.discarded.length));
  add("beary_discard_share", "Posts descartados por el control de citas, cuentas o fechas", kept + dropped ? (dropped / (kept + dropped)) * 100 : null, "pct", "Beary · verificación");
  add("beary_weeks", "Semanas analizadas por Beary", weeks.length, "count", "Beary");
  add("beary_weeks_reconstructed", "Semanas reconstruidas (no corridas en vivo)", weeks.filter((w) => w.reconstructed).length, "count", "Beary");

  const div = divergences(inputs);
  add("mirage_weeks", "Semanas marcadas como espejismo", div.filter((d) => d.quadrant === "espejismo").length, "count", "Bul · divergencias");

  const regime =
    regimeGap === null ? "sin datos" : regimeGap > PARAMS.regime_band_pct ? "expansión" : regimeGap < -PARAMS.regime_band_pct ? "contracción" : "lateral";
  const shift = (m.intents_call_share_change_pp?.value ?? 0) > 0 && (m.growth_gap_pp?.value ?? 0) > 0;
  const leads = best !== undefined && (best.forward ?? 0) >= PARAMS.lag_min_r && (best.forward ?? 0) > (bestReverse?.reverse ?? 0);
  const verdict = shift && leads ? "respaldada por los datos actuales" : shift || leads ? "parcialmente respaldada" : "no respaldada por los datos actuales";
  const strength = (r: number | null) => (r === null ? "sin datos" : Math.abs(r) < 0.3 ? "débil" : Math.abs(r) < 0.6 ? "moderada" : "fuerte");

  const labels = Object.fromEntries(
    [
      ["mode", inputs.mode === "mock" ? "SIMULADO (mock)" : "datos reales (live)"],
      ["generated_at", generatedAt.slice(0, 10)],
      ["last_block_date", manifest.freshness.last_block_date ?? "desconocida"],
      ["window_start", manifest.window.start],
      ["window_end", manifest.window.end],
      ["regime", regime],
      ["hypothesis_verdict", verdict],
      ["shift_status", shift ? "se observa" : "no se observa"],
      ["lead_status", leads ? "se observa" : "no se observa"],
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
  };
}
