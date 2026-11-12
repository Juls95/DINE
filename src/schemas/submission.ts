import { z } from "zod";

/** Contract of POST https://nearhackathon.com/api/applications (HACKATHON.md, "Submission API"). */
export const TRACKS = [
  "defi", "thesis", "privacy", "business", "swarms", "security", "agents",
  "realworld", "games", "nfts", "memecoins", "social", "open",
] as const;

const NEAR_ACCOUNT = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
const httpUrl = z.string().max(300).regex(/^https?:\/\//);

export const SubmissionPayload = z
  .object({
    requestId: z.string().uuid(),
    projectName: z.string().min(2).max(80),
    leadName: z.string().min(2).max(80),
    email: z.string().email().max(160),
    size: z.enum(["1", "2 - 4", "4 - 6", "6 - 8", "8+"]),
    tracks: z.array(z.enum(TRACKS)).min(1).refine((t) => new Set(t).size === t.length, "each track once"),
    nearAddress: z.string().min(2).max(64).regex(NEAR_ACCOUNT),
    projectUrl: httpUrl,
    demoUrl: httpUrl,
    idea: z.string().min(20).max(2000),
    consent: z.literal(true),
  })
  .strict();
export type SubmissionPayload = z.infer<typeof SubmissionPayload>;
