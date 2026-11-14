import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { parseContact } from "../../../src/schemas/signup";
import { SIGNUP_ENDPOINT, submitSignup, type SignupFailure } from "../lib/signup";

const DONE_KEY = "rdc.signup.done";
/** A person needs a moment to read and type; a script posts instantly. */
const MIN_FILL_MS = 2500;

const MESSAGE: Record<SignupFailure, string> = {
  not_configured: "Sign-ups are not open yet.",
  invalid_contact: "Enter a valid e-mail address or an X username (for example @near).",
  consent_required: "Please tick the box so we know you agree.",
  network: "We could not reach the sign-up service. Try again in a minute.",
  rejected: "The sign-up service refused the request. Check the address and try again.",
};

function wasDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

type Props = { endpoint?: string; fetchImpl?: typeof fetch; minFillMs?: number };

/** Newsletter-style sign-up: one field (e-mail or X username), explicit consent, honeypot and a time trap. */
export function SignupForm({ endpoint = SIGNUP_ENDPOINT, fetchImpl, minFillMs = MIN_FILL_MS }: Props) {
  const ids = { contact: useId(), consent: useId(), note: useId() };
  const shownAt = useRef<number | null>(null);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">(wasDone() ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);
  const closed = endpoint === "";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    if (!parseContact(contact)) return setError(MESSAGE.invalid_contact);
    if (!consent) return setError(MESSAGE.consent_required);
    if (shownAt.current !== null && Date.now() - shownAt.current < minFillMs) return setError("That was quick. Please wait a moment and send it again.");
    setState("sending");
    const result = await submitSignup({ contact, consent, website, endpoint, fetchImpl });
    if (result.ok) {
      try {
        // Only a flag is stored, never the address, so this device does not keep personal data.
        localStorage.setItem(DONE_KEY, "1");
      } catch {
        /* private mode */
      }
      setContact("");
      setState("done");
      return;
    }
    setState("idle");
    setError(MESSAGE[result.reason]);
  };

  if (state === "done") {
    return (
      <div className="signup signup-done" role="status">
        <strong>You are on the list.</strong> We will write when the thesis is updated or a tripwire changes.
      </div>
    );
  }

  return (
    <form className="signup" onSubmit={onSubmit} noValidate aria-describedby={ids.note}>
      <label htmlFor={ids.contact}>E-mail or X username</label>
      <div className="signup-row">
        <input
          id={ids.contact}
          name="contact"
          type="text"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.org or @handle"
          value={contact}
          onChange={(ev) => setContact(ev.target.value)}
          disabled={closed}
          required
        />
        <button type="submit" className="cta" disabled={closed || state === "sending"}>
          {state === "sending" ? "Sending…" : "Keep me posted"}
        </button>
      </div>

      {/* Honeypot: hidden from people and from assistive technology; bots fill every input they find. */}
      <div className="signup-trap" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(ev) => setWebsite(ev.target.value)} />
        </label>
      </div>

      <label className="signup-consent" htmlFor={ids.consent}>
        <input id={ids.consent} type="checkbox" checked={consent} onChange={(ev) => setConsent(ev.target.checked)} disabled={closed} />
        <span>I agree to be contacted about thesis updates and related news.</span>
      </label>

      <p className="muted signup-note" id={ids.note}>
        We keep only the address or username you type, to send updates and to reach you about this project. We do not sell or share it. Ask us to delete it at any time.
      </p>
      {closed ? <p className="muted" role="status">{MESSAGE.not_configured}</p> : null}
      {error ? <p className="signup-error" role="alert">{error}</p> : null}
    </form>
  );
}
