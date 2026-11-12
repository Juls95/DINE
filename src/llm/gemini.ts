import { z } from "zod";
import { requestJson } from "../lib/http";
import type { LlmClient, LlmJsonRequest } from "./types";

const GeminiResponse = z.object({
  candidates: z
    .array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }) }))
    .min(1),
});

export function createGeminiClient(apiKey: string, model: string, fetchImpl?: typeof fetch): LlmClient {
  return {
    provider: "gemini",
    model,
    async generateJson({ system, prompt }: LlmJsonRequest) {
      const res = await requestJson({
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        method: "POST",
        headers: { "x-goog-api-key": apiKey },
        body: {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        },
        schema: GeminiResponse,
        fetchImpl,
      });
      return res.candidates[0]?.content.parts.map((p) => p.text ?? "").join("") ?? "";
    },
  };
}
