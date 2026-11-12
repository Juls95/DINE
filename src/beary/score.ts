import type { ExtractedPost, HandleTier, ScoredPost } from "../schemas/beary";

/**
 * Pre-registered credibility parameters. They are published on /metodologia and must not be tuned
 * after looking at results; changing them requires a changelog entry in THESIS.md.
 */
export const SCORING = {
  tier: { official: 0.6, core: 0.55, ecosystem: 0.4, analyst: 0.35 } satisfies Record<HandleTier, number>,
  primarySourceBonus: 0.2,
  corroborationBonusPerHandle: 0.1,
  corroborationMaxHandles: 2,
  promoPenalty: 0.5,
  unsourcedNumberPenalty: 0.25,
} as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Independent handles that posted on the same topic the same day (excluding the author). */
function corroborators(post: ExtractedPost, sameDay: readonly ExtractedPost[]): number {
  const handles = new Set<string>();
  for (const other of sameDay) {
    if (other.handle.toLowerCase() === post.handle.toLowerCase()) continue;
    if (other.topics.some((t) => post.topics.includes(t))) handles.add(other.handle.toLowerCase());
  }
  return Math.min(handles.size, SCORING.corroborationMaxHandles);
}

export function scorePosts(posts: readonly ExtractedPost[], tiers: ReadonlyMap<string, HandleTier>): ScoredPost[] {
  return posts.map((post) => {
    const tier = tiers.get(post.handle.toLowerCase()) ?? "analyst";
    const components = {
      tier: SCORING.tier[tier],
      primary_source: post.primary_source_url ? SCORING.primarySourceBonus : 0,
      corroboration: corroborators(post, posts) * SCORING.corroborationBonusPerHandle,
      promo_penalty: post.claim_type === "promo" ? -SCORING.promoPenalty : 0,
      unsourced_number_penalty: post.contains_numeric_claim && !post.primary_source_url ? -SCORING.unsourcedNumberPenalty : 0,
    };
    const credibility = clamp01(Object.values(components).reduce((a, b) => a + b, 0));
    return { ...post, tier, credibility: Math.round(credibility * 1000) / 1000, components };
  });
}
