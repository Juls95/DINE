const DAY_MS = 86_400_000;

export const isoDay = (d: Date): string => d.toISOString().slice(0, 10);
export const parseDay = (s: string): Date => new Date(`${s}T00:00:00Z`);
export const addDays = (s: string, n: number): string => isoDay(new Date(parseDay(s).getTime() + n * DAY_MS));

export function daysBetween(start: string, endExclusive: string): string[] {
  const out: string[] = [];
  for (let d = start; d < endExclusive; d = addDays(d, 1)) out.push(d);
  return out;
}

/** ISO-8601 week label (YYYY-Www) of a UTC date. */
export function isoWeek(s: string): string {
  const d = parseDay(s);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Monday of the ISO week containing the date. */
export function weekStart(s: string): string {
  const day = parseDay(s).getUTCDay() || 7;
  return addDays(s, 1 - day);
}
