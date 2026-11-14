const SECRET_HEADER = /^(authorization|x-api-key|x-goog-api-key|cookie|set-cookie)$/i;
const SECRET_KEY = /(token|secret|password|api[_-]?key|jwt|authorization|credential)/i;
const JWT_LIKE = /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g;
const BEARER = /(Bearer\s+)[^\s"']+/gi;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const QUERY_KEY = /([?&](?:key|api_key|token)=)[^&\s"']+/gi;

export const REDACTED = "[REDACTED]";
export const EMAIL_PLACEHOLDER = "[email]";

/** Removes e-mail addresses from text that is published (Notion excerpts); private notes sometimes contain them. */
export function scrubPii(value: string): string {
  return value.replace(EMAIL, EMAIL_PLACEHOLDER);
}

export function redactString(value: string): string {
  return scrubPii(value.replace(BEARER, `$1${REDACTED}`).replace(JWT_LIKE, REDACTED).replace(QUERY_KEY, `$1${REDACTED}`));
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k, SECRET_HEADER.test(k) ? REDACTED : redactString(v)]),
  );
}

export function redactDeep(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SECRET_KEY.test(k) ? REDACTED : redactDeep(v)]),
    );
  }
  return value;
}
