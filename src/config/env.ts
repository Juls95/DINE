import { existsSync } from "node:fs";
import { z } from "zod";

const EnvSchema = z.object({
  DATA_MODE: z.enum(["mock", "live"]).default("live"),
  LLM_PROVIDER: z.enum(["gemini", "xai"]).default("gemini"),
  LLM_MODEL: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  XAI_API_KEY: z.string().min(1).optional(),
  XAI_MODEL: z.string().min(1).default("grok-4.7"),
  XAI_MAX_TURNS: z.coerce.number().int().positive().default(2),
  GCP_PROJECT_ID: z.string().min(1).optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1).optional(),
  BQ_MAX_BYTES: z.coerce.number().int().positive().default(20_000_000_000),
  BQ_WINDOW_DAYS: z.coerce.number().int().positive().default(180),
  INTENTS_JWT: z.string().min(1).optional(),
  INTENTS_CONTRACT: z.string().min(1).default("intents.near"),
  INTENTS_WINDOW_DAYS: z.coerce.number().int().positive().default(90),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (source === process.env && cached) return cached;
  if (source === process.env && existsSync(".env")) process.loadEnvFile(".env");
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  if (source === process.env) cached = parsed.data;
  return parsed.data;
}

/** Fail fast when a command needs credentials that are not configured. */
export function requireEnv<K extends keyof Env>(env: Env, keys: readonly K[]): { [P in K]-?: NonNullable<Env[P]> } {
  const missing = keys.filter((k) => env[k] === undefined || env[k] === "");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}. See .env.example.`);
  }
  return env as unknown as { [P in K]-?: NonNullable<Env[P]> };
}
