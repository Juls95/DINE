# Agent notes · NEAR RDC

Guidance for Cursor cloud agents and local agents working on this repository.

## Defaults

- Stack: Node 22, pnpm 10 (`packageManager` in `package.json`), TypeScript, Vite + React 19, zod, Jest + RTL.
- Language of all code, thesis, site and docs: **English**. Notion column names stay Spanish (external schema).
- Do not invent numbers. Thesis and chart text use `{{metric:…}}` placeholders; `DATA_MODE=mock pnpm verify` must stay green.
- Do not commit secrets: `.env`, `gcp-*.json`, service-account files. Tokens only via env / Render secrets (`sync: false`).
- One atomic feature per change set. Prefer small PRs. Ask before push if the human did not request it.

## Run without credentials (preferred for cloud agents)

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check          # lint (warnings = errors) + typecheck + tests
pnpm demo           # writes gitignored data/mock + builds dist/
DATA_MODE=mock pnpm verify
```

`pnpm demo` needs no Notion, BigQuery, Intents JWT or signup endpoint. The site shows a "SIMULATED DATA" banner.

## Live data (only with secrets the human provides)

- `NOTION_TOKEN`, GCP credentials, `INTENTS_JWT` — never invent or paste them into files.
- `pnpm refresh` then `DATA_MODE=live pnpm verify`.
- Price candles are optional: `data/raw/price/near.json` + `btc.json` (schema in `src/schemas/market.ts`). Without them technical metrics render as "not available".
- Sign-ups: set `SIGNUP_ENDPOINT=https://formspree.io/f/<id>` at build time (allowlisted). Empty keeps the form closed.

## Where things live

| Path | Role |
| --- | --- |
| `src/beary/` | Notion + X reading |
| `src/bison/` | BigQuery + Intents Explorer |
| `src/bul/` | Metrics, thesis template, verify, site bundle |
| `src/schemas/` | Zod contracts (fail fast) |
| `docs/SAMPLE_THESIS.md` | Generated sample thesis (mock) |
| `render.yaml` | Static site on Render; CSP/headers must match `src/config/security-headers.ts` |

## Constraints that must not regress

- Never mix mock and live artifacts (`loadInputs` throws).
- Never copy Galaxy research text verbatim (legal notice); paraphrase only, label `cited`.
- Never mention ProTrading Skills or PDF promotions in thesis or docs.
- External links: `HttpsUrl` at build, `safeHref` in the site; Notion page URLs stay unpublished.
- LLM calls stay behind env-swappable providers (`LLM_PROVIDER` / `LLM_MODEL`).
