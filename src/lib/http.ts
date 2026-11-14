import type { z } from "zod";
import { createLogger } from "./logger";
import { redactDeep, redactHeaders, redactString } from "./redact";

const log = createLogger("http");

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs: number | undefined,
    readonly body: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type HttpRequest<T> = {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  schema: z.ZodType<T>;
  fetchImpl?: typeof fetch;
};

/** Typed fetch: validates the response with zod and logs full (redacted) request/response context on failure. */
export async function requestJson<T>({ url, method = "GET", headers = {}, body, schema, fetchImpl = fetch }: HttpRequest<T>): Promise<T> {
  // Credentials travel in headers: refuse to send them over anything but TLS.
  if (new URL(url).protocol !== "https:") throw new Error(`Refusing non-https request: ${redactString(url)}`);
  const allHeaders = { "Content-Type": "application/json", ...headers };
  const res = await fetchImpl(url, {
    method,
    headers: allHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const context = {
    request: { method, url: redactString(url), headers: redactHeaders(allHeaders), body: redactDeep(body) },
    response: { status: res.status, body: redactString(text.slice(0, 4000)) },
  };
  if (!res.ok) {
    log.error("request failed", context);
    const retryAfter = Number(res.headers.get("retry-after"));
    throw new HttpError(`${method} ${redactString(url)} -> ${res.status}`, res.status, Number.isFinite(retryAfter) ? retryAfter * 1000 : undefined, text);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    log.error("response is not JSON", context);
    throw new HttpError(`${method} ${redactString(url)} -> invalid JSON`, res.status, undefined, text);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    log.error("response failed schema validation", { ...context, issues: parsed.error.issues.slice(0, 10) });
    throw new HttpError(`${method} ${redactString(url)} -> schema mismatch`, res.status, undefined, text);
  }
  return parsed.data;
}
