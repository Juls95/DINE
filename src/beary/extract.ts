import { z } from "zod";
import type { LlmClient } from "../llm/types";
import { ExtractedPost, type Discarded } from "../schemas/beary";

export const STRUCTURING_SYSTEM = `You convert a research answer about X posts into JSON.
Rules:
- Only include posts that appear in the provided CITATIONS list; copy the URL exactly.
- "paraphrase": your own words, max 240 characters. Never copy the post text verbatim.
- "contains_numeric_claim": true if the post states a figure (users, volume, TVL, price, growth...).
- "primary_source_url": a link in the post to near.org, docs, GitHub, an explorer or an official dashboard; otherwise null.
- "claim_type": announcement | metric | opinion | promo | other. Giveaways, referral links, "100x" calls are promo.
- "sentiment": -1 (very negative about NEAR) to 1 (very positive).
- Do not invent posts, dates or numbers. If unsure, omit the post.
Return {"posts":[...]} only.`;

export function structuringPrompt(searchAnswer: string, citations: readonly string[], date: string): string {
  return `DATE (UTC): ${date}\nCITATIONS:\n${citations.join("\n")}\n\nRESEARCH ANSWER:\n${searchAnswer}`;
}

const STATUS_URL = /^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/;

export function normalizeStatusUrl(url: string): { handle: string; id: string; canonical: string } | null {
  const m = STATUS_URL.exec(url);
  if (!m?.[1] || !m[2]) return null;
  return { handle: m[1], id: m[2], canonical: `https://x.com/${m[1]}/status/${m[2]}` };
}

export type VerifyInput = {
  posts: readonly unknown[];
  citations: ReadonlySet<string>;
  allowedHandles: ReadonlySet<string>;
  date: string;
};

/**
 * Anti-hallucination gate: a post survives only if it is well-formed, cited by xAI,
 * authored by an allowed handle, inside the requested day, and not a duplicate.
 */
export function verifyPosts({ posts, citations, allowedHandles, date }: VerifyInput): { kept: ExtractedPost[]; discarded: Discarded[] } {
  const cited = new Set([...citations].map((u) => normalizeStatusUrl(u)?.canonical).filter((u): u is string => Boolean(u)));
  const allowed = new Set([...allowedHandles].map((h) => h.toLowerCase()));
  const seen = new Set<string>();
  const kept: ExtractedPost[] = [];
  const discarded: Discarded[] = [];
  for (const raw of posts) {
    const parsed = ExtractedPost.safeParse(raw);
    const rawUrl = typeof raw === "object" && raw && "url" in raw ? String((raw as { url: unknown }).url) : "";
    if (!parsed.success) {
      discarded.push({ url: rawUrl, reason: "invalid_shape" });
      continue;
    }
    const post = parsed.data;
    const norm = normalizeStatusUrl(post.url);
    if (!norm || !cited.has(norm.canonical)) {
      discarded.push({ url: post.url, reason: "not_in_citations" });
      continue;
    }
    if (!allowed.has(norm.handle.toLowerCase())) {
      discarded.push({ url: post.url, reason: "handle_not_allowed" });
      continue;
    }
    if (post.date !== date) {
      discarded.push({ url: post.url, reason: "outside_date_window" });
      continue;
    }
    if (seen.has(norm.id)) {
      discarded.push({ url: post.url, reason: "duplicate" });
      continue;
    }
    seen.add(norm.id);
    kept.push({ ...post, url: norm.canonical, post_id: norm.id, handle: norm.handle });
  }
  return { kept, discarded };
}

export async function structureAnswer(llm: LlmClient, answer: string, citations: readonly string[], date: string): Promise<unknown[]> {
  const text = await llm.generateJson({ system: STRUCTURING_SYSTEM, prompt: structuringPrompt(answer, citations, date) });
  const parsed = z.object({ posts: z.array(z.unknown()) }).safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Structuring model returned an unexpected shape: ${parsed.error.message}`);
  return parsed.data.posts;
}