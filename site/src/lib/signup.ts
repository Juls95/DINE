import { isAllowedSignupEndpoint, parseContact, SignupPayload } from "../../../src/schemas/signup";

declare const __SIGNUP_ENDPOINT__: string | undefined;

/** Injected at build time from SIGNUP_ENDPOINT; empty means sign-ups are not open yet. */
export const SIGNUP_ENDPOINT: string = typeof __SIGNUP_ENDPOINT__ === "string" ? __SIGNUP_ENDPOINT__ : "";

export type SignupFailure = "not_configured" | "invalid_contact" | "consent_required" | "network" | "rejected";
export type SignupResult = { ok: true } | { ok: false; reason: SignupFailure; status?: number };

const TIMEOUT_MS = 10_000;

export type SignupRequest = {
  contact: string;
  consent: boolean;
  /** Honeypot: a person never fills it. */
  website?: string;
  endpoint?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Typed wrapper around the hosted form. It never logs or returns the contact data, because the only copy that may exist
 * outside the visitor's browser is the one held by the form provider.
 */
export async function submitSignup({ contact, consent, website = "", endpoint = SIGNUP_ENDPOINT, fetchImpl = fetch }: SignupRequest): Promise<SignupResult> {
  if (!endpoint || !isAllowedSignupEndpoint(endpoint)) return { ok: false, reason: "not_configured" };
  if (consent !== true) return { ok: false, reason: "consent_required" };
  const parsed = parseContact(contact);
  if (!parsed) return { ok: false, reason: "invalid_contact" };
  // A bot filled the hidden field: answer as if it worked, send nothing.
  if (website.length > 0) return { ok: true };

  const payload = SignupPayload.parse({ contact: parsed.value, kind: parsed.kind, consent: true, source: "rdc-site" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    return res.ok ? { ok: true } : { ok: false, reason: "rejected", status: res.status };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}
