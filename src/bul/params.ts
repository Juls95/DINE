/**
 * Pre-registered analysis parameters. Fixed before looking at live data and rendered into THESIS.md
 * through {{param:*}} placeholders; any change must be logged in the weekly changelog.
 */
export const PARAMS = {
  regime_band_pct: 5,
  spike_multiple: 2,
  spike_persistence_days: 7,
  spike_persistence_multiple: 1.3,
  spike_concentration_pct: 40,
  lag_max_days: 14,
  lag_smoothing_days: 7,
  lag_min_r: 0.3,
  divergence_onchain_band_pct: 1,
  divergence_sentiment_band: 0.05,
  invalidation_quarters: 2,
  window_days: 30,
} as const;

export type ParamId = keyof typeof PARAMS;

/** Transaction statuses counted as success. Must be checked against real `transactions.status` values before live use. */
export const SUCCESS_STATUS_PREFIX = "SUCCESS";
