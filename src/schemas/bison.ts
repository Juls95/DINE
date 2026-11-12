import { z } from "zod";
import { DataMode, IsoDate } from "./common";

const count = z.number().int().nonnegative();

export const DailyActivityRow = z.object({ date: IsoDate, daily_active_accounts: count, transactions: count });
export const TxStatusRow = z.object({ date: IsoDate, status: z.string(), transactions: count });
export const NewAccountsRow = z.object({ date: IsoDate, new_accounts: count });
export const ContractUsageRow = z.object({ date: IsoDate, contract: z.string(), calls: count, distinct_callers: count });
export const ContractActivityRow = z.object({
  date: IsoDate,
  function_calls: count,
  active_contracts: count,
  deploys: count,
  intents_calls: count,
});
export const ConcentrationRow = z.object({ date: IsoDate, top10_transactions: count, total_transactions: count });
export const MetaTxRow = z.object({ date: IsoDate, delegate_actions: count, delegating_accounts: count, total_actions: count });
export const IntentsDailyRow = z.object({
  date: IsoDate,
  swaps: count,
  volume_usd: z.number().nonnegative(),
  swaps_missing_usd: count,
  cross_chain_swaps: count,
});

export const BISON_DATASETS = {
  daily_activity: DailyActivityRow,
  tx_status: TxStatusRow,
  new_accounts: NewAccountsRow,
  contract_usage: ContractUsageRow,
  contract_activity: ContractActivityRow,
  concentration: ConcentrationRow,
  meta_tx: MetaTxRow,
  intents_daily: IntentsDailyRow,
} as const;

export type BisonDatasetId = keyof typeof BISON_DATASETS;

export const ManifestItem = z.object({
  id: z.string(),
  file: z.string(),
  source: z.enum(["bigquery", "intents-explorer", "mock"]),
  query_file: z.string().nullable(),
  endpoint: z.string().nullable(),
  params: z.record(z.string(), z.union([z.string(), z.number()])),
  rows: count,
  bytes_processed: z.number().nonnegative().nullable(),
  fetched_at: z.string(),
});

export const BisonManifest = z.object({
  mode: DataMode,
  generated_at: z.string(),
  window: z.object({ start: IsoDate, end: IsoDate }),
  freshness: z.object({ last_block_date: IsoDate.nullable(), checked_at: z.string() }),
  items: z.array(ManifestItem),
});
export type BisonManifest = z.infer<typeof BisonManifest>;

export function datasetFile(root: string, id: BisonDatasetId): string {
  return `${root}/raw/${id === "intents_daily" ? "intents" : "bq"}/${id}.json`;
}

export const DatasetFile = <T extends z.ZodType>(row: T) => z.object({ mode: DataMode, id: z.string(), rows: z.array(row) });
