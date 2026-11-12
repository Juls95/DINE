import { addDays, isoWeek } from "../lib/dates";
import type { BearyDaily, BearyWeekly, ScoredPost } from "../schemas/beary";

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/** Credibility-weighted mean sentiment; null when there is no evidence (never a fabricated zero). */
export function sentimentIndex(posts: readonly ScoredPost[]): number | null {
  const weight = posts.reduce((a, p) => a + p.credibility, 0);
  if (weight === 0) return null;
  return round(posts.reduce((a, p) => a + p.sentiment * p.credibility, 0) / weight);
}

export function buildWeekly(days: readonly BearyDaily[], weekMonday: string): BearyWeekly {
  const to = addDays(weekMonday, 7);
  const inWeek = days.filter((d) => d.date >= weekMonday && d.date < to);
  const posts = inWeek.flatMap((d) => d.posts);
  const byTopic = new Map<string, ScoredPost[]>();
  for (const p of posts) for (const t of p.topics) byTopic.set(t, [...(byTopic.get(t) ?? []), p]);
  const narratives = [...byTopic.entries()]
    .map(([topic, ps]) => ({
      topic,
      posts: ps.length,
      avg_sentiment: round(ps.reduce((a, p) => a + p.sentiment, 0) / ps.length),
      weight: round(ps.reduce((a, p) => a + p.credibility, 0)),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);
  const claims = posts
    .filter((p) => p.contains_numeric_claim && p.claim_type !== "promo")
    .sort((a, b) => b.credibility - a.credibility)
    .slice(0, 8)
    .map((p) => ({ post_id: p.post_id, url: p.url, paraphrase: p.paraphrase, topic: p.topics[0] ?? "general" }));
  const mode = inWeek[0]?.mode ?? "live";
  return {
    mode,
    week: isoWeek(weekMonday),
    from: weekMonday,
    to,
    reconstructed: inWeek.some((d) => d.reconstructed),
    post_count: posts.length,
    discarded_count: inWeek.reduce((a, d) => a + d.discarded.length, 0),
    sentiment_index: sentimentIndex(posts),
    narratives,
    claims_to_verify: claims,
  };
}
