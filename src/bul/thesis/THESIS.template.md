# NEAR investment thesis · Research Development Council

{{block:mode_banner}}

Generated: {{label:generated_at}} · On-chain data through: {{label:last_block_date}} · Window: {{label:window_start}} to {{label:window_end}} · Mode: {{label:mode}}

Agents: **Beary** (reads X with Grok), **Bison** (NEAR BigQuery and 1Click Swap), **Bul** (synthesis). Every figure in this document comes from `metrics.json`; none is written by hand.

## 1. Claim

Real NEAR usage is shifting toward cross-chain execution (1Click Swap on NEAR Intents), and that volume leads general on-chain activity: active accounts and contract usage. Horizon: one to two years.

**Hypothesis status:** {{label:hypothesis_verdict}}. Shift: {{label:shift_status}}. Lead: {{label:lead_status}}.

## 2. Adoption regime

As in a market-regime analysis, the regime gives direction, not timing. The median of daily active accounts over the last thirty days is {{metric:daa_median_30d}}, against {{metric:daa_median_90d}} over ninety days ({{metric:daa_30d_vs_90d_pct}}). With the pre-registered band of {{param:regime_band_pct}}%, the regime is **{{label:regime}}**.

Against the previous thirty days, the median changed {{metric:daa_30d_change_pct}}; transactions, {{metric:tx_30d_change_pct}}; accounts created, {{metric:new_accounts_30d_change_pct}}.

## 3. Pillars

- **Pillar A, shift:** the Intents contract receives {{metric:intents_call_share_30d}} of contract calls ({{metric:intents_call_share_change_pp}} against the previous window). 1Click volume was {{metric:intents_volume_30d_usd}} over thirty days.
- **Pillar B, lead:** the correlation between 1Click swap growth and active-account growth is highest at a lag of {{metric:lag_best_days}} ({{metric:lag_best_r}}, strength {{label:lag_strength}}).
- **Pillar C, quality of activity:** the ten most active signers generate {{metric:top10_share_median_30d}} of transactions; meta-transactions are {{metric:meta_tx_share_30d}} of actions; the success rate is {{metric:success_rate_30d}}.

## 4. Evidence for

{{block:evidence_for}}

## 5. Evidence against

{{block:evidence_against}}

## 6. Confirmations and mirages

A rally without confirmation is a mirage. Bul crosses Beary's sentiment with Bison's activity every week:

{{block:divergences}}

Active-account jumps (spike versus structural change; threshold: {{param:spike_multiple}} times the previous median, persistence of {{param:spike_persistence_days}} days):

{{block:spikes}}

## 7. Conditional scenarios

- If the Intents share keeps rising and the lagged correlation stays above {{param:lag_min_r}}, the thesis strengthens.
- If 1Click volume grows but active accounts do not respond within {{param:lag_max_days}} days, the volume is circular (arbitrage or rebalancing) rather than usage: the thesis weakens.
- If active accounts rise without a rising Intents share, there is growth but no shift: the thesis is reformulated.
- If a jump comes with more than {{param:spike_concentration_pct}}% of transactions in ten signers, it is treated as a spike and does not move the thesis.

## 8. What would change my mind

Thresholds fixed before seeing the real data:

- The best lagged correlation stays under {{param:lag_min_r}}, or the reverse correlation is higher, for {{param:invalidation_quarters}} consecutive quarters.
- The Intents contract share of calls falls in two consecutive windows of {{param:window_days}} days.
- The adoption regime is contraction for {{param:invalidation_quarters}} consecutive quarters.
- Mirage weeks outnumber confirmation weeks in a quarter.

## 9. Metrics that cannot be computed with these sources

- NEAR price, market capitalization and valuation multiples: there is no approved price source.
- TVL and fees in USD: they need prices and protocol data that are not in BigQuery or the Explorer.
- Total NEAR Intents volume: the Explorer only exposes 1Click Swap.
- Unique humans: an account is not a person; meta-transactions and relayers distort the count.
- Concentration of 1Click volume by user: only daily aggregates are stored, not addresses.

## 10. Weekly log

The table in section six is the log: each row is a weekly close by Bul, marked live or reconstructed.

## 11. Methodology and disclosure

- Sources: `bigquery-public-data.crypto_near_mainnet_us` (queries filtered by `block_date`, in `src/bison/bq/queries`), the Intents Explorer API (1Click Swap, status SUCCESS) and X search through xAI `x_search` over a fixed account list.
- Beary discards posts not cited by xAI, from accounts outside the list, or from another date; it discarded {{metric:beary_discard_share}} of the proposed posts. Figures quoted in posts are never used as data.
- Parameters live in `src/bul/params.ts` and `src/beary/score.ts`; changing them must be recorded.
- Not financial advice. The author declares no position. Parts of the code and text were generated with AI assistance.
