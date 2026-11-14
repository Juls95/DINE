/** Concise, decisive copy from labels already in the bundle. Never invents a number. */
export function verdictCopy(verdict: string | null, regime: string | null): { title: string; lede: string } {
  const v = (verdict ?? "").toLowerCase();
  let title = "No verdict yet.";
  if (v.includes("not supported")) title = "The thesis does not hold.";
  else if (v.includes("partially")) title = "The thesis holds in part.";
  else if (v.includes("supported")) title = "The thesis holds.";

  const bits = [
    regime ? `Regime: ${regime}.` : null,
    "NEAR usage is shifting to 1Click Swap on Intents, and that volume leads active accounts.",
  ].filter((x): x is string => Boolean(x));
  return { title, lede: bits.join(" ") };
}
