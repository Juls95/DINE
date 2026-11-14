import { z } from "zod";

/** Where sign-ups may be sent. A typo or a hostile environment value must never turn into an arbitrary POST target. */
const FORMSPREE_FORM = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]{6,24}$/;
export const SIGNUP_ORIGIN = "https://formspree.io";

export function isAllowedSignupEndpoint(value: string): boolean {
  return FORMSPREE_FORM.test(value);
}

const X_HANDLE = /^@?([A-Za-z0-9_]{1,15})$/;
const emailSchema = z.email().max(254);

export type Contact = { kind: "email"; value: string } | { kind: "x"; value: string };

/** An e-mail address or an X username; anything else is rejected. Emails are lowercased, handles get a single leading "@". */
export function parseContact(raw: string): Contact | null {
  const text = raw.trim();
  if (!text || text.length > 254 || /[\p{Cc}\s]/u.test(text)) return null;
  const handle = X_HANDLE.exec(text);
  if (handle?.[1]) return { kind: "x", value: `@${handle[1]}` };
  const email = emailSchema.safeParse(text);
  return email.success ? { kind: "email", value: email.data.toLowerCase() } : null;
}

/** What the visitor submitted. `website` is a honeypot field that humans never see. */
export const SignupInput = z.object({
  contact: z.string(),
  consent: z.literal(true, "consent is required"),
  website: z.string().max(0).optional(),
});
export type SignupInput = z.infer<typeof SignupInput>;

/** What is actually sent to the form backend. */
export const SignupPayload = z.object({
  contact: z.string().min(1).max(254),
  kind: z.enum(["email", "x"]),
  consent: z.literal(true),
  source: z.literal("rdc-site"),
});
export type SignupPayload = z.infer<typeof SignupPayload>;
