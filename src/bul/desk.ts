import type { BearyNotionSnapshot } from "../schemas/beary";
import type { DeskSnapshot } from "../schemas/market";
import { pctChange } from "./stats";
import type { AddMetric } from "./technical";
import type { MetricUnit } from "./types";

const DESK_SOURCE = "Notion desk notes (paraphrased, curated)";
const NOTION_SOURCE = "Notion · NEAR rows";

/** Figures the thesis template and the desk claims may quote. Missing ones render as "not available". */
const DESK_FIGURES: readonly (readonly [id: string, label: string, unit: MetricUnit])[] = [
  ["near_print_oct15", "NEAR price print in TickersInfo (mid-October)", "usd2"],
  ["near_print_oct25", "NEAR price print in TickersInfo (late October)", "usd2"],
  ["near_move_oct25_pct", "NEAR move quoted by a desk on the October selloff day", "pct"],
  ["btc_move_oct25_pct", "BTC move quoted on the same day", "pct"],
  ["btc_dominance_oct25_pct", "BTC dominance quoted on the same day", "pct"],
  ["omni_exploit_usd", "Omni bridge exploit size reported by a desk", "usd"],
  ["omni_networks_paused", "Networks with paused deposits and withdrawals after the exploit", "count"],
  ["whale_long_sep_usd", "Whale NEAR long reported by Arkham (September)", "usd"],
  ["whale_leverage", "Leverage on that long", "count"],
  ["whale_pnl_sep_usd", "Unrealized profit on that long (September)", "usd"],
  ["whale_long_oct_usd", "Whale NEAR long reported by Arkham (late October, lower bound)", "usd"],
  ["whale_pnl_oct_usd", "Profit on that long (late October, lower bound)", "usd"],
  ["whale_btc_shorts_usd", "Shorts the same whale keeps on major coins", "usd"],
  ["btc_oct25_low_usd", "BTC low quoted by desks on the October selloff day", "usd"],
  ["btc_nov01_usd", "BTC level quoted in the first November digest", "usd"],
  ["btc_nov11_usd", "BTC level quoted in the second November digest", "usd"],
];

const fig = (desk: DeskSnapshot | null, id: string): number | null => desk?.figures.find((f) => f.id === id)?.value ?? null;

export function registerDesk(desk: DeskSnapshot | null, notion: BearyNotionSnapshot | null, refs: Record<string, number>, add: AddMetric): {
  themes: { id: string; title: string; count: number }[];
} {
  for (const [id, label, unit] of DESK_FIGURES) add(`desk_${id}`, label, fig(desk, id), unit, DESK_SOURCE, undefined, "desk");
  // Any extra figure a curated file carries is exposed too, so claims can quote it.
  for (const f of desk?.figures ?? []) {
    if (!DESK_FIGURES.some(([id]) => id === f.id)) add(`desk_${f.id}`, f.label, f.value, f.unit, DESK_SOURCE, f.note, "desk");
  }
  add("desk_near_print_change_pct", "Change between the two NEAR price prints", pctChange(fig(desk, "near_print_oct25"), fig(desk, "near_print_oct15")), "pct", DESK_SOURCE, undefined, "desk");
  const near = fig(desk, "near_move_oct25_pct");
  const btc = fig(desk, "btc_move_oct25_pct");
  add("desk_alt_beta_ratio", "How many times harder NEAR fell than BTC on the selloff day", near !== null && btc !== null && btc !== 0 ? near / btc : null, "ratio", DESK_SOURCE, undefined, "desk");
  const tripwire = refs.ref_btc_tripwire_usd ?? null;
  add("desk_btc_vs_ref_tripwire_pct", "Desk BTC level versus the reference tripwire level", pctChange(fig(desk, "btc_nov11_usd"), tripwire), "pct", DESK_SOURCE, "An intraday level compared with a weekly-close rule: context, not a trigger.", "desk");
  add("desk_count", "Desks with NEAR rows in Notion", desk ? desk.desks.length : null, "count", DESK_SOURCE, undefined, "desk");
  add("desk_observations_count", "Desk observations curated", desk ? desk.observations.length : null, "count", DESK_SOURCE, undefined, "desk");

  const n = notion;
  const nm = (id: string, label: string, value: number | null) => add(id, label, value, "count", NOTION_SOURCE, undefined, "desk");
  nm("notion_rows_total", "NEAR rows read from Notion", n ? n.hits.length : null);
  nm("notion_rows_tickers", "TickersInfo rows", n ? n.counts.tickers : null);
  nm("notion_rows_creative", "X Creative Output rows", n ? n.counts.creative : null);
  nm("notion_rows_analyses", "X Account Analyses rows", n ? n.counts.analyses : null);
  nm("notion_false_positives", "False NEAR matches discarded", n ? n.counts.discarded_false_positives : null);
  nm("notion_sent_positive", "Rows labelled positive", n ? n.sentiment_tally.positive : null);
  nm("notion_sent_neutral", "Rows labelled neutral", n ? n.sentiment_tally.neutral : null);
  nm("notion_sent_negative", "Rows labelled negative", n ? n.sentiment_tally.negative : null);
  nm("notion_sent_mixed", "Rows labelled mixed", n ? n.sentiment_tally.mixed : null);

  const themes = (n?.themes ?? []).map((t) => ({ id: t.id, title: t.title, count: t.evidence_count }));
  for (const t of themes) nm(`notion_theme_${t.id}`, `Rows in theme: ${t.title}`, t.count);
  return { themes };
}
