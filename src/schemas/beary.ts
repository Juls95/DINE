import { z } from "zod";
import { DataMode, IsoDate, IsoWeek } from "./common";

export const HandleTier = z.enum(["official", "core", "ecosystem", "analyst"]);
export type HandleTier = z.infer<typeof HandleTier>;

export const HandleConfig = z.object({
  handles: z
    .array(z.object({ handle: z.string().regex(/^[A-Za-z0-9_]{1,15}$/), tier: HandleTier, note: z.string().optional() }))
    .min(1),
});
export type HandleConfig = z.infer<typeof HandleConfig>;

export const ClaimType = z.enum(["announcement", "metric", "opinion", "promo", "other"]);

/** What the structuring LLM must return per post. Only a short paraphrase is kept, never the full post text. */
export const ExtractedPost = z.object({
  post_id: z.string().min(1),
  url: z.string().url(),
  handle: z.string(),
  date: IsoDate,
  claim_type: ClaimType,
  paraphrase: z.string().max(240),
  primary_source_url: z.string().url().nullable(),
  contains_numeric_claim: z.boolean(),
  sentiment: z.number().min(-1).max(1),
  topics: z.array(z.string()).max(5),
});
export type ExtractedPost = z.infer<typeof ExtractedPost>;

export const ExtractionResult = z.object({ posts: z.array(ExtractedPost) });

export const ScoredPost = ExtractedPost.extend({
  tier: HandleTier,
  credibility: z.number().min(0).max(1),
  components: z.object({
    tier: z.number(),
    primary_source: z.number(),
    corroboration: z.number(),
    promo_penalty: z.number(),
    unsourced_number_penalty: z.number(),
  }),
});
export type ScoredPost = z.infer<typeof ScoredPost>;

export const DiscardReason = z.enum(["not_in_citations", "handle_not_allowed", "outside_date_window", "invalid_shape", "duplicate"]);
export const Discarded = z.object({ url: z.string(), reason: DiscardReason });
export type Discarded = z.infer<typeof Discarded>;

export const BearyDaily = z.object({
  mode: DataMode,
  date: IsoDate,
  reconstructed: z.boolean(),
  search_model: z.string(),
  structuring_model: z.string(),
  posts_fetched: z.number().int().nonnegative().nullable(),
  posts: z.array(ScoredPost),
  discarded: z.array(Discarded),
});
export type BearyDaily = z.infer<typeof BearyDaily>;

export const BearyWeekly = z.object({
  mode: DataMode,
  week: IsoWeek,
  from: IsoDate,
  to: IsoDate,
  reconstructed: z.boolean(),
  post_count: z.number().int().nonnegative(),
  discarded_count: z.number().int().nonnegative(),
  sentiment_index: z.number().min(-1).max(1).nullable(),
  narratives: z.array(z.object({ topic: z.string(), posts: z.number().int(), avg_sentiment: z.number(), weight: z.number() })),
  claims_to_verify: z.array(z.object({ post_id: z.string(), url: z.string(), paraphrase: z.string(), topic: z.string() })),
});
export type BearyWeekly = z.infer<typeof BearyWeekly>;
