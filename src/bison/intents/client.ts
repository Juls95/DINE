import { z } from "zod";
import { HttpError, requestJson } from "../../lib/http";
import { createLogger } from "../../lib/logger";

const log = createLogger("bison:intents");

export const INTENTS_BASE_URL = "https://explorer.near-intents.org/api/v0";
/** Explorer API limit: 1 request every 5 seconds per partner. */
export const MIN_INTERVAL_MS = 5_200;
const PAGE_SIZE = 1000;
const MAX_RETRIES = 5;

const Tx = z.looseObject({
  depositAddress: z.string(),
  depositMemo: z.string().nullable(),
  originAsset: z.string(),
  destinationAsset: z.string(),
  status: z.string(),
  createdAt: z.string(),
  amountInUsd: z.string().nullable(),
  amountOutUsd: z.string().nullable(),
});
const TxPage = z.array(Tx);
export type IntentsTx = z.infer<typeof Tx>;

export type SwapRecord = {
  createdAt: string;
  originAsset: string;
  destinationAsset: string;
  amountInUsd: number | null;
};

export type FetchSwapsOptions = {
  jwt: string;
  start: Date;
  end: Date;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxPages?: number;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function toNumberOrNull(v: string | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Walks /transactions backwards in time (direction=next) with cursor pagination, SUCCESS only, respecting the rate limit. */
export async function fetchSwaps({ jwt, start, end, fetchImpl, sleep = defaultSleep, maxPages = 10_000 }: FetchSwapsOptions): Promise<SwapRecord[]> {
  const out: SwapRecord[] = [];
  let cursor: { address: string; memo: string | null } | undefined;
  let retries = 0;
  for (let page = 0; page < maxPages; page++) {
    const qs = new URLSearchParams({
      numberOfTransactions: String(PAGE_SIZE),
      statuses: "SUCCESS",
      startTimestamp: start.toISOString(),
      endTimestamp: end.toISOString(),
      direction: "next",
    });
    if (cursor) {
      qs.set("lastDepositAddress", cursor.address);
      if (cursor.memo) qs.set("lastDepositMemo", cursor.memo);
    }
    let batch: IntentsTx[];
    try {
      batch = await requestJson({
        url: `${INTENTS_BASE_URL}/transactions?${qs}`,
        headers: { Authorization: `Bearer ${jwt}` },
        schema: TxPage,
        fetchImpl,
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 429 && retries < MAX_RETRIES) {
        retries++;
        const wait = err.retryAfterMs ?? MIN_INTERVAL_MS * 2 ** retries;
        log.warn("rate limited, backing off", { wait, retries });
        await sleep(wait);
        page--;
        continue;
      }
      throw err;
    }
    retries = 0;
    for (const t of batch) {
      out.push({
        createdAt: t.createdAt,
        originAsset: t.originAsset,
        destinationAsset: t.destinationAsset,
        amountInUsd: toNumberOrNull(t.amountInUsd),
      });
    }
    log.info("page", { page, size: batch.length, total: out.length });
    const last = batch.at(-1);
    if (!last || batch.length < PAGE_SIZE) break;
    cursor = { address: last.depositAddress, memo: last.depositMemo };
    await sleep(MIN_INTERVAL_MS);
  }
  return out;
}

/**
 * Heuristic, to be checked against real asset ids: bridged tokens are `nep141:<chain>-<address>.omft.near`
 * or `nep141:<chain>.omft.near`; any other id is treated as NEAR-native.
 */
export function chainOf(asset: string): string {
  const id = asset.includes(":") ? asset.slice(asset.indexOf(":") + 1) : asset;
  if (!id.endsWith(".omft.near")) return "near";
  const head = id.slice(0, -".omft.near".length);
  return (head.includes("-") ? head.split("-")[0] : head) ?? "near";
}

export function aggregateDaily(swaps: readonly SwapRecord[]) {
  const byDay = new Map<string, { swaps: number; volume_usd: number; swaps_missing_usd: number; cross_chain_swaps: number }>();
  for (const s of swaps) {
    const date = s.createdAt.slice(0, 10);
    const d = byDay.get(date) ?? { swaps: 0, volume_usd: 0, swaps_missing_usd: 0, cross_chain_swaps: 0 };
    d.swaps += 1;
    if (s.amountInUsd === null) d.swaps_missing_usd += 1;
    else d.volume_usd += s.amountInUsd;
    if (chainOf(s.originAsset) !== chainOf(s.destinationAsset)) d.cross_chain_swaps += 1;
    byDay.set(date, d);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, ...d, volume_usd: Math.round(d.volume_usd * 100) / 100 }));
}
