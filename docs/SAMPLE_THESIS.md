# NEAR investment thesis · Research Development Council

> **SAMPLE THESIS · SIMULATED DATA.** On-chain, price and sentiment figures come from a seeded simulation and do not describe NEAR; they exercise the format and the logic of the pipeline. Desk notes are real but paraphrased, and external references are cited and unverified: each figure carries its own provenance label.

Generated: 2026-11-14 · On-chain data through: 2026-11-13 · Window: 2026-05-18 to 2026-11-14 · Mode: SIMULATED (mock)

Agents: **Beary** (desk and X reading), **Bison** (NEAR on-chain data, 1Click Swap and price candles), **Bul** (synthesis). Every figure in this document comes from `metrics.json` or from a labelled data file; none is written by hand, and each one carries a provenance label: computed, simulated, desk (a claim by a public account) or cited (an external document, unverified).

## 1. Claim and stance

Real NEAR usage is shifting toward cross-chain execution (1Click Swap on NEAR Intents), and that volume leads general on-chain activity: active accounts and contract usage. Horizon: one to two years.

**Stance:** constructive on direction; timing is not confirmed.

- **Direction (on-chain):** hypothesis supported by current data. Shift: observed. Lead: observed. Adoption regime: expansion.
- **Timing (price):** technical bias neutral (4 of 8 checks met). Plan status: setup available.
- **Context (Bitcoin):** weekly-average tripwire breached, regain window open.

The regime gives direction, not timing. Direction comes from usage data; timing comes from price structure; the Bitcoin regime gates both because NEAR moves 1.61 times as much as BTC.

## 2. How this thesis is built

- **Fundamental lens**, borrowed from a company-style thesis: engagement, monetization, moat, threats, bull and bear cases. NEAR has no income statement, so each lens is mapped to a computable on-chain proxy and the gaps are stated.
- **Macro lens**, borrowed from a Bitcoin research note: a technical floor, positioning, a fundamental narrative, sentiment, risks, and an explicit statement of what would change the view.
- **Technical lens**, from a range and nPOC framework: trend, range, Fibonacci levels, unfilled prints, relative strength and multi-timeframe confluence.
- **Social lens**: what public desks say about NEAR in the author's Notion tables, kept as claims to verify.

## 3. Fundamental: the usage engine

| Lens | NEAR proxy | Value | Provenance |
| --- | --- | --- | --- |
| Engagement growth | Median daily active accounts against the previous thirty days | 9.7% | simulated |
| Engagement regime | Thirty-day median against the ninety-day median | 13.1% | simulated |
| Monetization proxy | 1Click Swap volume over thirty days | $332,930,184 | simulated |
| Usage intensity | 1Click swaps per thousand daily active accounts | 31.84 | simulated |
| Moat proxy | Intents contract share of contract calls | 10.8% | simulated |
| Cross-chain depth | Swaps between different chains | 75.7% | simulated |
| Quality of users | Share of transactions from the ten most active signers | 12.6% | simulated |
| Reliability | Successful transactions | 98.2% | simulated |

The pillars in one line each:

- **Pillar A, shift:** the Intents contract receives 10.8% of contract calls (+1.4 pp against the previous window).
- **Pillar B, lead:** the correlation between 1Click swap growth and active-account growth is highest at a lag of 8 days (0.65, strength strong).
- **Pillar C, quality of activity:** meta-transactions are 6.3% of actions and the median number of accounts using them each day is 247,770.

**What the reference company thesis teaches, and where it stops.** That thesis rests on engagement turning into paying users: it relays a paid share of 9.0%, daily-active-user growth of 51.0% and a gross margin of 73.0% (cited, unverified). NEAR has no audited equivalent of paid conversion or gross margin. The closest computable proxy is swaps per thousand accounts, which is an intensity ratio and not a conversion rate. Retention cannot be computed either, because addresses are not joined across datasets.

## 4. Macro regime: the Bitcoin lens

NEAR is a high-beta asset, so Bitcoin sets the regime. Over 90 days NEAR has a beta of 1.61 to BTC and a correlation of 0.69 (simulated).

| Item | Value | Provenance |
| --- | --- | --- |
| BTC last close | $73,518 | simulated |
| Weekly average (50 weeks) | $78,851 | simulated |
| Close against the weekly average | -6.8% | simulated |
| Consecutive weekly closes below it | 3 | simulated |
| Drawdown from the fifty-two-week closing high | -21.5% | simulated |
| Tripwire state | breached, regain window open | simulated |

**Tripwire logic.** The reference Bitcoin note says its view changes if a weekly close below the weekly average is not regained within about a month. Here that rule is tested on the price series with a regain window of 4 weeks, and the state is breached, regain window open.

**Cross-check against desk notes.** A digest in the author's Notion quotes BTC near $71,500 on November eleventh, which is -6.6% against the reference note's level of $76,540 (cited). The rule is about weekly closes and the desk quote is an intraday level, so this is context and not a trigger. The reference note also frames Bitcoin through monetary debasement, with federal debt of 40.44 trillion dollars and a ten-year yield of 5.3%, and places the cycle at day 916 after the halving. Those are quoted as the note's context, not as evidence about NEAR.

**How alts behaved in the last drawdown.** On the October selloff day desks quote NEAR at -5.4% and BTC at -0.9%, about 6.00 times as hard, with BTC dominance at 60.1%. TickersInfo records NEAR prints of $4.60 and $4.45, a change of -3.3% between them.

## 5. Technical read: range, nPOC and confluence

Price data here is simulated, scaled to a desk price print. The framework follows a range and nPOC method: a negative point of control is a price level left unfilled by a fast move, and it acts as a magnet until a candle closes at or through it.

| Item | Value |
| --- | --- |
| Last close | $4.65 |
| Fast and slow daily averages | $4.67 and $5.06 |
| Close against the slow average | -8.1% |
| Trend | below both averages; weekly: above the weekly average |
| RSI | 48.20 |
| Range (last 90 days) | low $2.89, median $4.11, high $5.33 |
| Position inside the range | 72.4% (premium zone) |
| Fibonacci levels | $3.82, $4.39, $4.80; nearest is 0.786, 3.3% away |
| Open nPOC levels | 1 below the close and 0 above |
| Nearest lower nPOC | $3.82; distance below the close: 17.8% |
| Nearest upper nPOC | not available; distance above the close: not available |
| Relative strength against BTC | +4.9 pp over 30 days |

**Multi-timeframe confluence.** A lower nPOC is a long-entry zone and an upper nPOC is a take-profit zone; confidence rises when daily trend, weekly trend, range zone and nPOC proximity agree.

| Check | Met |
| --- | --- |
| The close is above the slow daily average | no |
| The close is above the fast daily average | no |
| The weekly close is above the weekly average | yes |
| The close sits in the discount half of the range | no |
| An open nPOC sits close below the close | no |
| RSI is not overbought | yes |
| NEAR is outperforming BTC | yes |
| The on-chain adoption regime is expansion | yes |

Score: 4 of 8. Constructive needs at least 5 and defensive is 2 or fewer, so the technical bias is **neutral**.

**Illustrative risk template, not a recommendation.** Status: setup available. A limit order at the nearest lower nPOC ($3.82), a stop 2.5% beyond it ($3.73), a first target at the range median ($4.11) and a second at $5.33 gives a reward-to-risk of 2.98 to the first target. Risking 1% of an example account of $10,000 ($100) sizes the position at 1,047 NEAR. Rules from the framework: move the stop to breakeven after half the move to the first target, and peel profits in parts.

## 6. What the desks say

The author's Notion holds three tables. 10 rows mention NEAR (2 in TickersInfo, 2 in X Creative Output and 6 in X Account Analyses), from 7 public desks; 0 false matches on the English word were discarded. Labelled sentiment: 2 positive, 1 neutral, 1 negative and 1 mixed. These labels belong to each row and are not Beary's sentiment index.

Themes in the rows:

- NEAR Intents / Omni (matching rows: 2)
- On-chain positioning (matching rows: 2)
- NEAR × Brave (matching rows: 1)
- Price tape and alts (matching rows: 2)

Curated observations (12), paraphrased. They are claims by public accounts: Bison has not verified any of them.

| Date | Desk | Topic | Claim (paraphrased) |
| --- | --- | --- | --- |
| 2026-09-07 | X Creative Output | setup | The daily recap notes NEAR breaking above resistance. |
| 2026-09-18 | Nebraskangooner | setup | Lists NEAR among the constructive charts; the recap speaks of a weekly base forming. |
| 2026-09-22 | CastilloTrading | setup | Names NEAR among possible bottoms, next to several other large alts. |
| 2026-09-26 | arkham | positioning | A whale wallet tracked by Arkham holds a NEAR long of $29,700,000 at 10 times leverage, with about $16,000,000 in unrealized profit. |
| 2026-09-30 | Nebraskangooner | setup | Calls NEAR a giant bottom with a strong monthly candle. |
| 2026-10-01 | Zeneca | setup | Lists NEAR among the names showing relative strength during corrections. |
| 2026-10-02 | TradingLatino | exploit | Reports an Omni bridge exploit of about $3,800,000 on NEAR Intents; deposits and withdrawals were paused on 11 networks and refunds were promised. Service was then restored and the incident narrowed to one stablecoin route. The desk states that the NEAR chain and token were not affected. |
| 2026-10-08 | Zeneca | positioning | Includes NEAR in a ten-name conviction list for the cycle. |
| 2026-10-16 | Zeneca | partnership | Reports an alliance between NEAR and Brave (a thin sample of posts). |
| 2026-10-25 | Nebraskangooner | macro | Alts sold off harder than BTC: NEAR -5.4% against BTC -0.9%, with BTC dominance at 60.1%. |
| 2026-10-26 | arkham | positioning | The same whale reports more than $10,000,000 in profit on a NEAR long above $25,000,000, while keeping $13,100,000 in shorts on major coins. |
| 2026-10-28 | CastilloTrading | setup | Reports that the small NEAR long, held with ZRO, HYPE and ONDO, is in profit and keeps a short-term bullish bias tied to a BTC nPOC level. |

## 7. Confirmations and mirages

A rally without confirmation is a mirage. Bul crosses Beary's sentiment with Bison's activity every week:

| Week | Type | Sentiment (Beary) | Week-over-week active accounts (Bison) | Bul reading |
| --- | --- | --- | --- | --- |
| 2026-W41 | reconstructed | +0.29 | 17.0% | no data |
| 2026-W42 | reconstructed | +0.28 | -21.5% | neutral |
| 2026-W43 | reconstructed | +0.24 | 13.7% | neutral |
| 2026-W44 | reconstructed | +0.25 | 3.7% | neutral |
| 2026-W45 | reconstructed | +0.61 | -7.6% | mirage |
| 2026-W46 | live | +0.33 | not available | no data |

Active-account jumps (spike versus structural change; threshold: 2 times the previous median, persistence of 7 days):

- 2026-10-05: spike (not structural); the ten most active signers produced 58.0% of transactions.

## 8. Evidence for

- The Intents contract share of contract calls changed +1.4 pp against the previous thirty days (now 10.8%).
- 1Click volume grew 18.2% while active accounts changed 9.7%: cross-chain execution is growing faster than the base.
- 1Click swap growth leads active-account growth: the peak correlation is 0.65 at a lag of 8 days, higher than in the reverse direction (0.44).
- The adoption regime is expansion: the thirty-day median of active accounts is 13.1% above the ninety-day median.
- NEAR outperformed BTC by +4.9 pp over 30 days.
- Desk claim: one large wallet holds a leveraged NEAR long with more than $10,000,000 in profit. It is positioning by one actor, not usage.

## 9. Evidence against

- Technical confluence is neutral: only 4 of 8 checks are met (constructive needs 5).
- NEAR closes -8.1% from its slow daily average, so the long-term trend has not turned.
- NEAR moves 1.61 times as much as BTC (beta), so a BTC breakdown would hit it harder.
- The BTC weekly-average tripwire is breached, regain window open: 3 weekly closes below the average (the regain window is 4 weeks).
- Security: a desk reports an Omni bridge exploit of about $3,800,000 on NEAR Intents. The same desk says the chain and token were unaffected, but Intents is the pillar this thesis leans on.
- On the October selloff day NEAR fell -5.4% against -0.9% for BTC, about 6.00 times as hard (desk figures).
- Active-account jumps classified as spikes (they do not persist or are concentrated): 1. They are not counted as adoption.
- Mirage weeks detected (sentiment rose without on-chain activity following): 1.
- 1,275 swaps in the last thirty days report no USD value; volume is understated by that much.
- 1Click Swap is only one part of NEAR Intents; total Intents volume cannot be measured with these sources.
- The correlation uses 69 day pairs; a lagged correlation does not prove causality.
- 5 of 6 Beary weeks are reconstructed from historical search, not run live.

## 10. Conditional scenarios

- **Bull:** the Intents share keeps rising, the lagged correlation stays above 0.3, price holds above the nearest lower nPOC and the BTC tripwire is regained inside its window. Direction and timing align.
- **Base:** usage keeps growing but price stays between the averages and the range median. Wait for a close back above the slow average or a pullback to the lower nPOC with confluence at 5 or more.
- **Bear:** BTC loses its weekly average for 4 weeks, NEAR closes below the lower nPOC (the print is then cleared and the long-entry zone is gone) and 1Click volume grows without active accounts responding within 14 days. Then the volume is circular and the thesis weakens.
- If a jump comes with more than 40% of transactions in ten signers, it is treated as a spike and does not move the thesis.

## 11. What would change my mind

Thresholds fixed before seeing the real data:

- The best lagged correlation stays under 0.3, or the reverse correlation is higher, for 2 consecutive quarters.
- The Intents contract share of calls falls in two consecutive windows of 30 days.
- The adoption regime is contraction for 2 consecutive quarters.
- Mirage weeks outnumber confirmation weeks in a quarter.
- A BTC weekly close below its 50-week average that is not regained within 4 weeks moves the stance to defensive until it is.
- NEAR closes below its lower nPOC level on a daily close while the confluence score is at or under 2.
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
| NEAR BigQuery dataset | Activity, contracts, concentration, meta-transactions | simulated |
| Intents Explorer, 1Click Swap | Volume, swaps, cross-chain share | simulated |
| Daily candles for NEAR and BTC | Technical layer and BTC regime | simulated, scaled to a desk price print |
| Notion tables (TickersInfo, X Creative Output, X Account Analyses) | Desk reading | real rows, paraphrased sample |
| Curated desk figures | Cross-checks and claims | real notes, curated sample |
| X search through xAI | Weekly sentiment index | simulated |
| Company-style reference thesis | Fundamental lens only | cited, unverified, not reproduced |
| Bitcoin research note dated 2026-10-22 | Macro lens and tripwire cross-check | cited, unverified, not reproduced |

## 14. Methodology and disclosure

- Sources: `bigquery-public-data.crypto_near_mainnet_us` (queries filtered by `block_date`, in `src/bison/bq/queries`), the Intents Explorer API (1Click Swap, status SUCCESS), daily candles from a price source configured outside this repository, Notion tables read with a token held only in the environment, and X search through xAI `x_search` over a fixed account list.
- Beary discards posts not cited by xAI, from accounts outside the list, or from another date; it discarded 13.8% of the proposed posts. Figures quoted in posts or desk notes are never used as measured data.
- The technical framework (range, nPOC, Fibonacci levels, multi-timeframe confluence, risk sizing) comes from methodology notes supplied by the author and is implemented in `src/bul/technical.ts`. The nPOC method is approximated on daily candles.
- External documents are paraphrased and attributed as lenses. The Bitcoin note forbids redistribution, so none of its text is reproduced. Their figures were relayed by the author and have not been verified.
- Parameters live in `src/bul/params.ts` and `src/beary/score.ts`; changing them must be recorded.
- Not financial advice. The risk template is an illustration of position sizing. The author declares no position. Parts of the code and text were generated with AI assistance.
