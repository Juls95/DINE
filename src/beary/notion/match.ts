/** Ticker-style $NEAR. */
const TICKER = /\$NEAR\b/;
/**
 * The ecosystem token in ALL CAPS. Rejects English "near" / "nearly" / "nearest".
 * Allows concatenated handles such as NEARProtocol / NEARIntents.
 */
const PROPER = /(^|[^A-Za-z])NEAR(Protocol|Intents)?(?![A-Za-z])/;

/** True when the text talks about the NEAR ecosystem, not the English adverb. */
export function mentionsNear(text: string): boolean {
  if (!text) return false;
  return TICKER.test(text) || PROPER.test(text);
}

/** TickersInfo title: "NEAR" or anything that starts with "NEAR " (e.g. NEAR Intents). */
export function isNearTicker(ticker: string): boolean {
  return /^NEAR(\s|$)/.test(ticker.trim());
}

export function mentionsNearFields(...fields: readonly (string | null | undefined)[]): boolean {
  return fields.some((f) => typeof f === "string" && mentionsNear(f));
}
