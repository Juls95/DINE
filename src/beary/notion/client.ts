import { z } from "zod";
import { requestJson } from "../../lib/http";
import { createLogger } from "../../lib/logger";

const log = createLogger("beary:notion");

export const NOTION_API = "https://api.notion.com/v1";
export const PAGE_SIZE = 100;
/** Notion's typical burst budget; stay under 3 requests/second. */
export const MIN_INTERVAL_MS = 350;

const NotionPage = z.looseObject({
  id: z.string(),
  url: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});
const NotionQuery = z.object({
  results: z.array(NotionPage),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
});
export type NotionPage = z.infer<typeof NotionPage>;

export type NotionFilter = Record<string, unknown>;

export type QueryDatabaseOptions = {
  token: string;
  version: string;
  databaseId: string;
  filter?: NotionFilter;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxPages?: number;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function richContains(property: string, type: "title" | "rich_text", query: string) {
  return { property, [type]: { contains: query } };
}

/** Server-side contains "NEAR"; Beary still post-filters so "nearly" never counts. */
export function nearFilter(properties: readonly { name: string; type: "title" | "rich_text" }[]): NotionFilter {
  return { or: properties.map((p) => richContains(p.name, p.type, "NEAR")) };
}

export const TICKERS_FILTER = nearFilter([
  { name: "Ticker", type: "title" },
  { name: "LastNews", type: "rich_text" },
  { name: "What it does", type: "rich_text" },
  { name: "Sector", type: "rich_text" },
]);

export const CREATIVE_FILTER = nearFilter([
  { name: "Título", type: "title" },
  { name: "Resumen ejecutivo", type: "rich_text" },
  { name: "Insights clave", type: "rich_text" },
  { name: "Topic / Tema principal", type: "rich_text" },
  { name: "Posts destacados", type: "rich_text" },
]);

export const ANALYSES_FILTER = nearFilter([
  { name: "Título", type: "title" },
  { name: "Cuenta analizada", type: "rich_text" },
  { name: "Resumen ejecutivo", type: "rich_text" },
  { name: "Insights clave", type: "rich_text" },
  { name: "Topic / Tema principal", type: "rich_text" },
  { name: "Posts destacados", type: "rich_text" },
]);

function texts(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return items
    .map((t) => (t && typeof t === "object" && "plain_text" in t ? String((t as { plain_text: unknown }).plain_text) : ""))
    .join("");
}

/** Flatten a Notion property to plain text. Unknown types become "". */
export function propertyText(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  switch (p.type) {
    case "title":
      return texts(p.title);
    case "rich_text":
      return texts(p.rich_text);
    case "select":
      return p.select && typeof p.select === "object" && "name" in p.select ? String((p.select as { name: unknown }).name ?? "") : "";
    case "multi_select":
      return Array.isArray(p.multi_select)
        ? p.multi_select.map((x) => (x && typeof x === "object" && "name" in x ? String((x as { name: unknown }).name) : "")).filter(Boolean).join(", ")
        : "";
    case "email":
      return typeof p.email === "string" ? p.email : "";
    case "number":
      return typeof p.number === "number" ? String(p.number) : "";
    case "date":
      return p.date && typeof p.date === "object" && "start" in p.date && typeof (p.date as { start: unknown }).start === "string"
        ? String((p.date as { start: string }).start).slice(0, 10)
        : "";
    default:
      return "";
  }
}

export function propertyNumber(prop: unknown): number | null {
  if (!prop || typeof prop !== "object") return null;
  const p = prop as Record<string, unknown>;
  return p.type === "number" && typeof p.number === "number" ? p.number : null;
}

export function readProps(page: NotionPage): Record<string, unknown> {
  return page.properties ?? {};
}

/** Walk /v1/databases/{id}/query with cursor pagination. */
export async function queryDatabase({
  token,
  version,
  databaseId,
  filter,
  fetchImpl,
  sleep = defaultSleep,
  maxPages = 50,
}: QueryDatabaseOptions): Promise<NotionPage[]> {
  const out: NotionPage[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const body: Record<string, unknown> = { page_size: PAGE_SIZE };
    if (filter) body.filter = filter;
    if (cursor) body.start_cursor = cursor;
    const batch = await requestJson({
      url: `${NOTION_API}/databases/${databaseId}/query`,
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": version },
      body,
      schema: NotionQuery,
      fetchImpl,
    });
    out.push(...batch.results);
    log.info("notion page", { databaseId, page, size: batch.results.length, total: out.length });
    if (!batch.has_more || !batch.next_cursor) break;
    cursor = batch.next_cursor;
    await sleep(MIN_INTERVAL_MS);
  }
  return out;
}
