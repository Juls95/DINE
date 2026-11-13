/** Concise, decisive copy from labels already in the bundle. Never invents a number. */
export function verdictCopy(verdict: string | null, regime: string | null): { title: string; lede: string } {
  const v = (verdict ?? "").toLowerCase();
  let title = "Sin veredicto todavía.";
  if (v.includes("no respaldada")) title = "La tesis no se sostiene.";
  else if (v.includes("parcial")) title = "La tesis se sostiene a medias.";
  else if (v.includes("respaldada")) title = "La tesis se sostiene.";

  const bits = [
    regime ? `Régimen: ${regime}.` : null,
    "El uso de NEAR se desplaza a 1Click Swap sobre Intents, y ese volumen anticipa las cuentas activas.",
  ].filter((x): x is string => Boolean(x));
  return { title, lede: bits.join(" ") };
}
