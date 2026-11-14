# NEAR RDC · Research Development Council

> **Abstract.** Evidence-first, long-term investment thesis for NEAR (track `thesis`, NEAR HACKATHON 2026). Three agents: **Beary** reads TickersInfo, X Creative Output and X Account Analyses in Notion (token only via `NOTION_TOKEN`) plus a fixed list of X accounts with xAI `x_search`, **Bison** queries `bigquery-public-data.crypto_near_mainnet_us` (always filtered on `block_date`) plus the NEAR Intents Explorer API, and **Bul** rebuilds every chart, a static dashboard and `THESIS.md` from raw files with one command. A verifier fails the build if any number in the thesis or chart text was not computed from data.

## What it is

A long-term investment thesis on NEAR that is judged by its evidence, not by its conviction. The hypothesis is that NEAR usage is shifting toward cross-chain execution (1Click Swap on NEAR Intents) and that this volume leads general on-chain activity. The thesis states in advance which data would invalidate it.

## What problem it solves

Crypto investment theses tend to mix unsourced figures, screenshots and opinion. Here every figure comes from a versioned query or a documented endpoint, every chart shows its query and a plain sentence, and anyone can rebuild everything from the raw data.

## Try it

Requirements: Node 22 and pnpm 10 (`corepack enable`). pnpm downloads Node 22.21.1 through `.npmrc` if needed.

| Do this | You will see this |
| --- | --- |
| `pnpm install && pnpm demo` | Simulated data in `data/mock/`, the sample thesis in [`docs/SAMPLE_THESIS.md`](docs/SAMPLE_THESIS.md) and the site in `dist/`, with no credentials. |
| `pnpm preview` and open `http://localhost:4173` | The site with a red "SIMULATED DATA" strip. |
| Go to **Agora** | Beary, Bison and Bul evaluated separately, each with its validations, and the weekly table of sentiment against activity. |
| Open an agent, for example **Bison** | What it does, inputs, outputs, runs and validations (byte cap, `block_date` filter, data freshness). |
| Go to **Dashboard** and open "Query" under a chart | The exact SQL or endpoint that produced that chart. |
| Type a literal number into `src/bul/thesis/THESIS.template.md` and run `DATA_MODE=mock pnpm verify` | The build fails and points at the line: no number can come from hand-written text. |
| `pnpm test` | The Jest suite: cost guards, pagination and rate limiting, Beary's anti-hallucination filter, metric computation and the site components. |

With credentials (see `.env.example`): `pnpm refresh` downloads real data, writes `data/` and `THESIS.md`, and rebuilds the site. Without credentials, `pnpm bul:build` rebuilds everything from the committed files in `data/`.

### Notion and Render (Beary)

The browser never calls Notion: the CSP is `connect-src 'self'`. The token only exists in the build environment.

1. Create an Internal Integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) with read permission.
2. Share **TickersInfo**, **X Creative Output** and **X Account Analyses** with that integration.
3. Locally: copy `.env.example` to `.env` and paste the token into `NOTION_TOKEN`. Never commit it.
4. Render → Environment → `NOTION_TOKEN` as a secret (`sync: false` in `render.yaml`). The table IDs are already in the YAML; they are not secrets.
5. `pnpm beary:notion` (or a deploy) writes `data/beary/notion/near.json`. The site shows it under **Social**.

## How it works

| Agent | Source | What it produces |
| --- | --- | --- |
| **Beary** (psychological read) | Notion (`TickersInfo`, `X Creative Output`, `X Account Analyses`) with `NOTION_TOKEN` + xAI Responses API with `x_search`, limited to `config/beary.handles.yaml` and one day per query | A NEAR dossier in `data/beary/notion/near.json` (it filters out the English words *near*/*nearly*), posts verified against xAI's citations, a credibility score computed in code and a weekly sentiment index. It stores paraphrases and URLs, never the full text of a post. The token never reaches the bundle or git. |
| **Bison** (technical read) | BigQuery `crypto_near_mainnet_us` (`blocks`, `transactions`, `receipt_actions`) and the Intents Explorer `GET /api/v0/transactions` | Active accounts, transactions, new accounts, contract usage, concentration, meta-transactions and 1Click Swap volume. Every query goes through a dry run with the `BQ_MAX_BYTES` cap. |
| **Bul** (synthesis) | Files from Beary and Bison, plus optional daily candles and the curated desk file | Adoption regime, spikes versus structural changes, lagged correlation, confirmations and mirages, the technical layer (below), `THESIS.md`, the dashboard and `bundle.json`. |

Rules the code enforces:

- **Never invent numbers.** `THESIS.md` and the chart sentences contain only placeholders (`{{metric:id}}`) that Bul fills with computed values. `pnpm verify` renders everything with a sentinel and fails if any digit is left outside a placeholder.
- **What cannot be measured is said.** The thesis section "Metrics that cannot be computed" lists price, TVL, USD fees, total Intents volume and unique humans.
- **Simulated and real data are never mixed.** `DATA_MODE=mock` writes to git-ignored folders and the build fails if it finds artifacts from another mode.
- **The language model is swappable.** `LLM_PROVIDER=gemini|xai` and `LLM_MODEL` choose the structuring model without code changes.

### Sign-ups for updates

Visitors can leave an e-mail address or an X username on the landing page and on `#/updates`. The site is static, so the form posts to a hosted form service (Formspree) and nothing is stored by this repository.

- **Setup (human):** create a Formspree form, then set `SIGNUP_ENDPOINT=https://formspree.io/f/<id>` in Render (or `.env` for a local build). The build fails if the value is not a Formspree form URL; empty keeps the form disabled with a "not open yet" message.
- **Validation:** `src/schemas/signup.ts` (zod) accepts a valid e-mail or an X username and nothing else; explicit consent is required.
- **Abuse resistance:** a hidden honeypot field (bots that fill it get a fake success and nothing is sent), a minimum fill time, one request at a time, and the CSP allows `connect-src` only to this site and `https://formspree.io`.
- **Privacy:** the address is never logged, never written to `localStorage` (only a "done" flag) and never put in the repo. The page says what is collected and why.

### Technical and macro layer

The thesis ends with a stance that combines three independent reads, never one: on-chain adoption (Bison), technical structure and the Bitcoin regime.

- **Structure.** Naked points of control (a fast candle leaves an unfilled print at the middle of its body; a level only closes when a candle *closes* through it, a wick does not count), a range framework (high, low, median, premium and discount) with Fibonacci levels, an eight-item confluence checklist with pre-registered thresholds, and a risk template (stop beyond the level, position size from account and risk percent, breakeven at half way to the first target). Prints are approximated on daily candles; intraday prints are listed as not computable.
- **Bitcoin regime.** Beta and correlation of NEAR to BTC, and a weekly-average tripwire with a regain window.
- **Reference lenses.** An engagement-to-monetization thesis (DUOL) and a Bitcoin regime alert are used as frameworks only. Their figures are labelled `cited`, unverified, and never enter the NEAR evidence. The Bitcoin alert is paraphrased, not copied, because its legal notice forbids redistribution.
- **Desk notes.** `data/beary/desk/near.json` holds paraphrased claims from public desks in Notion. Claims quote figures only through placeholders, so the verifier covers them too.
- **Price source.** No approved price source is configured: put daily candles in `data/raw/price/near.json` and `btc.json` (schema in `src/schemas/market.ts`). Without them every technical metric reads "not available" and the thesis says so.

Every metric carries a provenance label: `computed`, `simulated`, `desk` or `cited`. In `DATA_MODE=mock` the on-chain, price and sentiment series are simulated and the banner says so.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm demo` | The simulated scenario end to end. |
| `pnpm bison:fetch` | BigQuery and the Intents Explorer, into `data/raw/`. |
| `pnpm beary:notion` | Reads the three Notion tables and writes `data/beary/notion/near.json`. Without `NOTION_TOKEN` it exits cleanly (Render can still deploy). |
| `pnpm beary:run` / `pnpm beary:backfill` | Yesterday live / four reconstructed weeks, into `data/beary/` (it also runs Notion if a token is set). |
| `pnpm bul:build` | Metrics, `THESIS.md`, `bundle.json` and the static site in `dist/`. |
| `pnpm refresh` | The three above, in order. |
| `pnpm verify` | Checks the never-invent-numbers rule. |
| `pnpm check` | Lint (warnings count as errors), typecheck and tests. |

## Hackathon window and disclosure

- All the code in this repository was written during NEAR HACKATHON (from 2026-11-01). There is no earlier product on another chain.
- Parts of the code and text were generated with AI assistance.
- Not financial advice.

## Libraries

TypeScript, tsx, Vite, React, Vega, Vega-Lite and vega-embed, zod, debug, yaml, `@google-cloud/bigquery`; Jest, babel-jest, React Testing Library, ESLint with typescript-eslint. No earlier templates or in-house libraries were used.

## License

MIT, see `LICENSE`.
