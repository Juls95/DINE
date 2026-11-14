# NEAR investment thesis · Research Development Council

{{block:mode_banner}}

Generated: {{label:generated_at}} · On-chain data through: {{label:last_block_date}} · Window: {{label:window_start}} to {{label:window_end}} · Mode: {{label:mode}}

Agents: **Beary** (desk and X reading), **Bison** (NEAR on-chain data, 1Click Swap and price candles), **Bul** (synthesis). Every figure in this document comes from `metrics.json` or from a labelled data file; none is written by hand, and each one carries a provenance label: computed, simulated, desk (a claim by a public account) or cited (an external document, unverified).

## 1. Claim and stance

Real NEAR usage is shifting toward cross-chain execution (1Click Swap on NEAR Intents), and that volume leads general on-chain activity: active accounts and contract usage. Horizon: one to two years.

**Stance:** {{label:stance}}.

- **Direction (on-chain):** hypothesis {{label:hypothesis_verdict}}. Shift: {{label:shift_status}}. Lead: {{label:lead_status}}. Adoption regime: {{label:regime}}.
- **Timing (price):** technical bias {{label:technical_bias}} ({{metric:confluence_score}} of {{metric:confluence_total}} checks met). Plan status: {{label:plan_status}}.
- **Context (Bitcoin):** weekly-average tripwire {{label:btc_tripwire}}.

The regime gives direction, not timing. Direction comes from usage data; timing comes from price structure; the Bitcoin regime gates both because NEAR moves {{metric:near_beta_90d}} times as much as BTC.

## 2. How this thesis is built

- **Fundamental lens**, borrowed from a company-style thesis: engagement, monetization, moat, threats, bull and bear cases. NEAR has no income statement, so each lens is mapped to a computable on-chain proxy and the gaps are stated.
- **Macro lens**, borrowed from a Bitcoin research note: a technical floor, positioning, a fundamental narrative, sentiment, risks, and an explicit statement of what would change the view.
- **Technical lens**, from a range and nPOC framework: trend, range, Fibonacci levels, unfilled prints, relative strength and multi-timeframe confluence.
- **Social lens**: what public desks say about NEAR in the author's Notion tables, kept as claims to verify.

## 3. Fundamental: the usage engine

| Lens | NEAR proxy | Value | Provenance |
| --- | --- | --- | --- |
| Engagement growth | Median daily active accounts against the previous thirty days | {{metric:daa_30d_change_pct}} | {{prov:daa_30d_change_pct}} |
| Engagement regime | Thirty-day median against the ninety-day median | {{metric:daa_30d_vs_90d_pct}} | {{prov:daa_30d_vs_90d_pct}} |
| Monetization proxy | 1Click Swap volume over thirty days | {{metric:intents_volume_30d_usd}} | {{prov:intents_volume_30d_usd}} |
| Usage intensity | 1Click swaps per thousand daily active accounts | {{metric:swaps_per_1k_daa}} | {{prov:swaps_per_1k_daa}} |
| Moat proxy | Intents contract share of contract calls | {{metric:intents_call_share_30d}} | {{prov:intents_call_share_30d}} |
| Cross-chain depth | Swaps between different chains | {{metric:intents_cross_chain_share_30d}} | {{prov:intents_cross_chain_share_30d}} |
| Quality of users | Share of transactions from the ten most active signers | {{metric:top10_share_median_30d}} | {{prov:top10_share_median_30d}} |
| Reliability | Successful transactions | {{metric:success_rate_30d}} | {{prov:success_rate_30d}} |

The pillars in one line each:

- **Pillar A, shift:** the Intents contract receives {{metric:intents_call_share_30d}} of contract calls ({{metric:intents_call_share_change_pp}} against the previous window).
- **Pillar B, lead:** the correlation between 1Click swap growth and active-account growth is highest at a lag of {{metric:lag_best_days}} ({{metric:lag_best_r}}, strength {{label:lag_strength}}).
- **Pillar C, quality of activity:** meta-transactions are {{metric:meta_tx_share_30d}} of actions and the median number of accounts using them each day is {{metric:delegating_accounts_median_30d}}.

**What the reference company thesis teaches, and where it stops.** That thesis rests on engagement turning into paying users: it relays a paid share of {{metric:ref_duol_paid_share_pct}}, daily-active-user growth of {{metric:ref_duol_dau_growth_pct}} and a gross margin of {{metric:ref_duol_gross_margin_pct}} ({{prov:ref_duol_paid_share_pct}}, unverified). NEAR has no audited equivalent of paid conversion or gross margin. The closest computable proxy is swaps per thousand accounts, which is an intensity ratio and not a conversion rate. Retention cannot be computed either, because addresses are not joined across datasets.

## 4. Macro regime: the Bitcoin lens

NEAR is a high-beta asset, so Bitcoin sets the regime. Over {{param:beta_lookback_days}} days NEAR has a beta of {{metric:near_beta_90d}} to BTC and a correlation of {{metric:near_btc_corr_90d}} ({{prov:near_beta_90d}}).

| Item | Value | Provenance |
| --- | --- | --- |
| BTC last close | {{metric:btc_close}} | {{prov:btc_close}} |
| Weekly average ({{param:btc_wma_weeks}} weeks) | {{metric:btc_wma}} | {{prov:btc_wma}} |
| Close against the weekly average | {{metric:btc_vs_wma_pct}} | {{prov:btc_vs_wma_pct}} |
| Consecutive weekly closes below it | {{metric:btc_weeks_below_wma}} | {{prov:btc_weeks_below_wma}} |
| Drawdown from the fifty-two-week closing high | {{metric:btc_drawdown_pct}} | {{prov:btc_drawdown_pct}} |
| Tripwire state | {{label:btc_tripwire}} | {{prov:btc_wma}} |

**Tripwire logic.** The reference Bitcoin note says its view changes if a weekly close below the weekly average is not regained within about a month. Here that rule is tested on the price series with a regain window of {{param:tripwire_regain_weeks}} weeks, and the state is {{label:btc_tripwire}}.

**Cross-check against desk notes.** A digest in the author's Notion quotes BTC near {{metric:desk_btc_nov11_usd}} on November eleventh, which is {{metric:desk_btc_vs_ref_tripwire_pct}} against the reference note's level of {{metric:ref_btc_tripwire_usd}} ({{prov:ref_btc_tripwire_usd}}). The rule is about weekly closes and the desk quote is an intraday level, so this is context and not a trigger. The reference note also frames Bitcoin through monetary debasement, with federal debt of {{metric:ref_us_debt_trn}} trillion dollars and a ten-year yield of {{metric:ref_us_10y_pct}}, and places the cycle at day {{metric:ref_btc_cycle_day}} after the halving. Those are quoted as the note's context, not as evidence about NEAR.

**How alts behaved in the last drawdown.** On the October selloff day desks quote NEAR at {{metric:desk_near_move_oct25_pct}} and BTC at {{metric:desk_btc_move_oct25_pct}}, about {{metric:desk_alt_beta_ratio}} times as hard, with BTC dominance at {{metric:desk_btc_dominance_oct25_pct}}. TickersInfo records NEAR prints of {{metric:desk_near_print_oct15}} and {{metric:desk_near_print_oct25}}, a change of {{metric:desk_near_print_change_pct}} between them.

## 5. Technical read: range, nPOC and confluence

Price data here is {{label:src_price}}. The framework follows a range and nPOC method: a negative point of control is a price level left unfilled by a fast move, and it acts as a magnet until a candle closes at or through it.

| Item | Value |
| --- | --- |
| Last close | {{metric:near_close}} |
| Fast and slow daily averages | {{metric:near_sma_fast}} and {{metric:near_sma_slow}} |
| Close against the slow average | {{metric:near_vs_sma_slow_pct}} |
| Trend | {{label:near_trend}}; weekly: {{label:near_weekly_trend}} |
| RSI | {{metric:near_rsi}} |
| Range (last {{param:range_lookback_days}} days) | low {{metric:range_low}}, median {{metric:range_median}}, high {{metric:range_high}} |
| Position inside the range | {{metric:range_position_pct}} ({{label:range_zone}} zone) |
| Fibonacci levels | {{metric:fib_382}}, {{metric:fib_618}}, {{metric:fib_786}}; nearest is {{label:fib_nearest}}, {{metric:fib_nearest_pct}} away |
| Open nPOC levels | {{metric:npoc_open_lower}} below the close and {{metric:npoc_open_upper}} above |
| Nearest lower nPOC | {{metric:npoc_lower_level}}; distance below the close: {{metric:npoc_lower_distance_pct}} |
| Nearest upper nPOC | {{metric:npoc_upper_level}}; distance above the close: {{metric:npoc_upper_distance_pct}} |
| Relative strength against BTC | {{metric:rs_vs_btc_30d_pp}} over {{param:rs_lookback_days}} days |

**Multi-timeframe confluence.** A lower nPOC is a long-entry zone and an upper nPOC is a take-profit zone; confidence rises when daily trend, weekly trend, range zone and nPOC proximity agree.

{{block:confluence}}

Score: {{metric:confluence_score}} of {{metric:confluence_total}}. Constructive needs at least {{param:confluence_constructive_min}} and defensive is {{param:confluence_defensive_max}} or fewer, so the technical bias is **{{label:technical_bias}}**.

**Illustrative risk template, not a recommendation.** Status: {{label:plan_status}}. A limit order at the nearest lower nPOC ({{metric:plan_entry}}), a stop {{param:stop_beyond_npoc_pct}}% beyond it ({{metric:plan_stop}}), a first target at the range median ({{metric:plan_t1}}) and a second at {{metric:plan_t2}} gives a reward-to-risk of {{metric:plan_rr}} to the first target. Risking {{param:risk_per_trade_pct}}% of an example account of {{metric:plan_account_usd}} ({{metric:plan_risk_usd}}) sizes the position at {{metric:plan_size_units}} NEAR. Rules from the framework: move the stop to breakeven after half the move to the first target, and peel profits in parts.

## 6. What the desks say

The author's Notion holds three tables. {{metric:notion_rows_total}} rows mention NEAR ({{metric:notion_rows_tickers}} in TickersInfo, {{metric:notion_rows_creative}} in X Creative Output and {{metric:notion_rows_analyses}} in X Account Analyses), from {{metric:desk_count}} public desks; {{metric:notion_false_positives}} false matches on the English word were discarded. Labelled sentiment: {{metric:notion_sent_positive}} positive, {{metric:notion_sent_neutral}} neutral, {{metric:notion_sent_negative}} negative and {{metric:notion_sent_mixed}} mixed. These labels belong to each row and are not Beary's sentiment index.

Themes in the rows:

{{block:notion_themes}}

Curated observations ({{metric:desk_observations_count}}), paraphrased. They are claims by public accounts: Bison has not verified any of them.

{{block:desk_observations}}

## 7. Confirmations and mirages

A rally without confirmation is a mirage. Bul crosses Beary's sentiment with Bison's activity every week:

{{block:divergences}}

Active-account jumps (spike versus structural change; threshold: {{param:spike_multiple}} times the previous median, persistence of {{param:spike_persistence_days}} days):

{{block:spikes}}

## 8. Evidence for

{{block:evidence_for}}

## 9. Evidence against

{{block:evidence_against}}

## 10. Conditional scenarios

- **Bull:** the Intents share keeps rising, the lagged correlation stays above {{param:lag_min_r}}, price holds above the nearest lower nPOC and the BTC tripwire is regained inside its window. Direction and timing align.
- **Base:** usage keeps growing but price stays between the averages and the range median. Wait for a close back above the slow average or a pullback to the lower nPOC with confluence at {{param:confluence_constructive_min}} or more.
- **Bear:** BTC loses its weekly average for {{param:tripwire_regain_weeks}} weeks, NEAR closes below the lower nPOC (the print is then cleared and the long-entry zone is gone) and 1Click volume grows without active accounts responding within {{param:lag_max_days}} days. Then the volume is circular and the thesis weakens.
- If a jump comes with more than {{param:spike_concentration_pct}}% of transactions in ten signers, it is treated as a spike and does not move the thesis.

## 11. What would change my mind

Thresholds fixed before seeing the real data:

- The best lagged correlation stays under {{param:lag_min_r}}, or the reverse correlation is higher, for {{param:invalidation_quarters}} consecutive quarters.
- The Intents contract share of calls falls in two consecutive windows of {{param:window_days}} days.
- The adoption regime is contraction for {{param:invalidation_quarters}} consecutive quarters.
- Mirage weeks outnumber confirmation weeks in a quarter.
- A BTC weekly close below its {{param:btc_wma_weeks}}-week average that is not regained within {{param:tripwire_regain_weeks}} weeks moves the stance to defensive until it is.
- NEAR closes below its lower nPOC level on a daily close while the confluence score is at or under {{param:confluence_defensive_max}}.
- A second security incident on NEAR Intents, or any evidence that the chain or token was affected by one.

## 12. Metrics that cannot be computed with these sources

- NEAR market capitalization and valuation multiples: there is no approved source for them.
- TVL and fees in USD: they need prices and protocol data that are not in BigQuery or the Explorer.
- Total NEAR Intents volume: the Explorer only exposes 1Click Swap.
- Unique humans and retention: an account is not a person, and addresses are not joined across datasets.
- Concentration of 1Click volume by user: only daily aggregates are stored.
- Intraday nPOC prints: only daily candles are used, so prints are approximated at the middle of the body of fast candles.
- Anything a desk quotes: those figures are claims until Bison measures them.

## 13. Provenance of every input

| Input | Used for | Status |
| --- | --- | --- |
| NEAR BigQuery dataset | Activity, contracts, concentration, meta-transactions | {{label:src_chain}} |
| Intents Explorer, 1Click Swap | Volume, swaps, cross-chain share | {{label:src_chain}} |
| Daily candles for NEAR and BTC | Technical layer and BTC regime | {{label:src_price}} |
| Notion tables (TickersInfo, X Creative Output, X Account Analyses) | Desk reading | {{label:src_notion}} |
| Curated desk figures | Cross-checks and claims | {{label:src_desk}} |
| X search through xAI | Weekly sentiment index | {{label:src_x}} |
| Company-style reference thesis | Fundamental lens only | cited, unverified, not reproduced |
| Bitcoin research note dated {{label:ref_btc_date}} | Macro lens and tripwire cross-check | cited, unverified, not reproduced |

## 14. Methodology and disclosure

- Sources: `bigquery-public-data.crypto_near_mainnet_us` (queries filtered by `block_date`, in `src/bison/bq/queries`), the Intents Explorer API (1Click Swap, status SUCCESS), daily candles from a price source configured outside this repository, Notion tables read with a token held only in the environment, and X search through xAI `x_search` over a fixed account list.
- Beary discards posts not cited by xAI, from accounts outside the list, or from another date; it discarded {{metric:beary_discard_share}} of the proposed posts. Figures quoted in posts or desk notes are never used as measured data.
- The technical framework (range, nPOC, Fibonacci levels, multi-timeframe confluence, risk sizing) comes from methodology notes supplied by the author and is implemented in `src/bul/technical.ts`. The nPOC method is approximated on daily candles.
- External documents are paraphrased and attributed as lenses. The Bitcoin note forbids redistribution, so none of its text is reproduced. Their figures were relayed by the author and have not been verified.
- Parameters live in `src/bul/params.ts` and `src/beary/score.ts`; changing them must be recorded.
- Not financial advice. The risk template is an illustration of position sizing. The author declares no position. Parts of the code and text were generated with AI assistance.
