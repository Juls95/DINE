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
  // Technical layer (price). Pre-registered like the on-chain parameters.
  sma_fast_days: 50,
  sma_slow_days: 200,
  weekly_sma_weeks: 20,
  rsi_days: 14,
  atr_days: 14,
  npoc_impulse_atr: 2,
  npoc_body_share_pct: 60,
  npoc_proximity_pct: 8,
  range_lookback_days: 90,
  rs_lookback_days: 30,
  beta_lookback_days: 90,
  btc_wma_weeks: 50,
  tripwire_regain_weeks: 4,
  confluence_constructive_min: 5,
  confluence_defensive_max: 2,
  stop_beyond_npoc_pct: 2.5,
  risk_per_trade_pct: 1,
  example_account_usd: 10000,
} as const;

export type ParamId = keyof typeof PARAMS;

/** Transaction statuses counted as success. Must be checked against real `transactions.status` values before live use. */
export const SUCCESS_STATUS_PREFIX = "SUCCESS";
