const SECRET_HEADER = /^(authorization|x-api-key|x-goog-api-key|cookie|set-cookie)$/i;
const SECRET_KEY = /(token|secret|password|api[_-]?key|jwt|authorization|credential)/i;
const JWT_LIKE = /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g;
const BEARER = /(Bearer\s+)[^\s"']+/gi;
const QUERY_KEY = /([?&](?:key|api_key|token)=)[^&\s"']+/gi;

export const REDACTED = "[REDACTED]";

export function redactString(value: string): string {
  return value.replace(BEARER, `$1${REDACTED}`).replace(JWT_LIKE, REDACTED).replace(QUERY_KEY, `$1${REDACTED}`);
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
