import { requireEnv, type Env } from "../config/env";
import { createGeminiClient } from "./gemini";
import { createXaiClient } from "./xai";
import type { LlmClient } from "./types";

/** Switching the structuring model is an env flip: LLM_PROVIDER + LLM_MODEL. */
export function createLlmClient(env: Env): LlmClient {
  if (env.LLM_PROVIDER === "xai") {
    const { XAI_API_KEY } = requireEnv(env, ["XAI_API_KEY"]);
    return createXaiClient(XAI_API_KEY, env.LLM_MODEL ?? env.XAI_MODEL);
  }
  const { GEMINI_API_KEY, LLM_MODEL } = requireEnv(env, ["GEMINI_API_KEY", "LLM_MODEL"]);
  return createGeminiClient(GEMINI_API_KEY, LLM_MODEL);
}

export type { LlmClient } from "./types";
