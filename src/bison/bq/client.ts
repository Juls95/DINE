import { readFileSync } from "node:fs";
import { createLogger } from "../../lib/logger";
import { repoPath } from "../../lib/paths";

const log = createLogger("bison:bq");

export type QueryParams = Record<string, string | number>;
export type QueryTypes = Record<string, "DATE" | "STRING" | "INT64">;

/** Minimal surface of the BigQuery client so the cost guard can be tested without GCP. */
export interface BqBackend {
  dryRun(sql: string, params: QueryParams, types: QueryTypes): Promise<number>;
  run(sql: string, params: QueryParams, types: QueryTypes, maxBytes: number): Promise<Record<string, unknown>[]>;
}

export class CostGuardError extends Error {
  constructor(readonly queryId: string, readonly bytes: number, readonly maxBytes: number) {
    super(`Query ${queryId} would process ${bytes} bytes, above BQ_MAX_BYTES=${maxBytes}. Narrow the window or raise the cap deliberately.`);
    this.name = "CostGuardError";
  }
}

const PARTITION_FILTER = /block_date\s*>=\s*@start_date[\s\S]*block_date\s*<\s*@end_date/;

export function loadQuery(id: string): string {
  if (!/^[a-z_]+$/.test(id)) throw new Error(`Invalid query id: ${id}`);
  const sql = readFileSync(repoPath("src/bison/bq/queries", `${id}.sql`), "utf8");
  if (!PARTITION_FILTER.test(sql)) throw new Error(`Query ${id} must filter on block_date with @start_date/@end_date`);
  return sql;
}

export type GuardedResult = { rows: Record<string, unknown>[]; bytesProcessed: number };

/** Dry-run first; refuse to execute anything above the byte cap; execute with maximumBytesBilled as a second fence. */
export async function runGuarded(
  backend: BqBackend,
  queryId: string,
  params: QueryParams,
  types: QueryTypes,
  maxBytes: number,
): Promise<GuardedResult> {
  const sql = loadQuery(queryId);
  const bytes = await backend.dryRun(sql, params, types);
  log.info("dry run", { queryId, bytes, maxBytes });
  if (bytes > maxBytes) throw new CostGuardError(queryId, bytes, maxBytes);
  const rows = await backend.run(sql, params, types, maxBytes);
  return { rows, bytesProcessed: bytes };
}

export async function createBigQueryBackend(projectId: string): Promise<BqBackend> {
  const { BigQuery } = await import("@google-cloud/bigquery");
  const bq = new BigQuery({ projectId });
  return {
    async dryRun(sql, params, types) {
      const [job] = await bq.createQueryJob({ query: sql, params, types, location: "US", dryRun: true });
      return Number(job.metadata?.statistics?.totalBytesProcessed ?? 0);
    },
    async run(sql, params, types, maxBytes) {
      const [rows] = await bq.query({ query: sql, params, types, location: "US", maximumBytesBilled: String(maxBytes) });
      return rows as Record<string, unknown>[];
    },
  };
}
