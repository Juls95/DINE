import type { MetricUnit } from "./types";

/**
 * External reference theses used only as analytical lenses and as cited context. Everything here is
 * paraphrased and attributed; no text is copied (the research alert carries a no-redistribution notice).
 * Figures are relayed by the author and have NOT been independently verified, which every output says.
 */
export type ExternalReference = {
  id: "company_thesis" | "btc_alert";
  title: string;
  publisher: string;
  date: string | null;
  use: string;
};

export const EXTERNAL_REFERENCES: readonly ExternalReference[] = [
  {
    id: "company_thesis",
    title: "Company-style thesis on a consumer language-learning app",
    publisher: "Substack newsletter, as relayed by the author",
    date: null,
    use: "Lens: engagement, monetization, moat, threats, bull and bear cases.",
  },
  {
    id: "btc_alert",
    title: "Bitcoin research alert (technical, positioning, fundamental, sentiment, risks, what would change the view)",
    publisher: "Galaxy research desk, as relayed by the author",
    date: "2026-10-22",
    use: "Lens and tripwire cross-check. Not reproduced: the original forbids redistribution.",
  },
];

export const EXTERNAL_FIGURES: readonly { id: string; label: string; value: number; unit: MetricUnit }[] = [
  { id: "ref_duol_paid_share_pct", label: "Reference company: share of users who pay (relayed)", value: 9, unit: "pct" },
  { id: "ref_duol_dau_growth_pct", label: "Reference company: daily-active-user growth (relayed)", value: 51, unit: "pct" },
  { id: "ref_duol_gross_margin_pct", label: "Reference company: gross margin (relayed)", value: 73, unit: "pct" },
  { id: "ref_btc_tripwire_usd", label: "Reference BTC thesis: tripwire level on the weekly average (relayed)", value: 76540, unit: "usd" },
  { id: "ref_btc_cycle_day", label: "Reference BTC thesis: day of the post-halving cycle (relayed)", value: 916, unit: "count" },
  { id: "ref_us_debt_trn", label: "Reference BTC thesis: US federal debt in trillions of dollars (relayed)", value: 40.44, unit: "ratio" },
  { id: "ref_us_10y_pct", label: "Reference BTC thesis: ten-year Treasury yield (relayed)", value: 5.31, unit: "pct" },
];

export const EXTERNAL_NOTE = "Relayed by the author from an external document; not independently verified. Used as a lens, never as NEAR evidence.";

export function externalValues(): Record<string, number> {
  return Object.fromEntries(EXTERNAL_FIGURES.map((f) => [f.id, f.value]));
}
