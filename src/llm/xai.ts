import { z } from "zod";
import { requestJson } from "../lib/http";
import type { LlmClient, LlmJsonRequest } from "./types";

const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";

const Annotation = z.looseObject({ type: z.string().optional(), url: z.string().optional() });
const OutputItem = z.looseObject({
  type: z.string(),
  content: z.array(z.looseObject({ type: z.string(), text: z.string().optional(), annotations: z.array(Annotation).optional() })).optional(),
});
export const XaiResponse = z.looseObject({
  output: z.array(OutputItem),
  citations: z.array(z.union([z.string(), z.looseObject({ url: z.string() })])).optional(),
  usage: z
    .looseObject({ server_side_tool_usage_details: z.looseObject({ x_posts_fetched: z.number().optional() }).optional() })
    .optional(),
});
export type XaiResponse = z.infer<typeof XaiResponse>;

export function outputText(res: XaiResponse): string {
  return res.output
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .map((c) => c.text ?? "")
    .join("");
}

/** Every URL xAI reports as a citation, from both the top-level list and inline annotations. */
export function citationUrls(res: XaiResponse): Set<string> {
  const urls = new Set<string>();
  for (const c of res.citations ?? []) urls.add(typeof c === "string" ? c : c.url);
  for (const o of res.output) for (const c of o.content ?? []) for (const a of c.annotations ?? []) if (a.url) urls.add(a.url);
  return urls;
}

export type XSearchParams = {
  apiKey: string;
  model: string;
  maxTurns: number;
  prompt: string;
  handles: string[];
  fromDate: string;
  toDate: string;
  fetchImpl?: typeof fetch;
};

export async function xSearch(p: XSearchParams): Promise<XaiResponse> {
  if (p.handles.length === 0 || p.handles.length > 20) throw new Error("x_search accepts 1-20 handles per request");
  return requestJson({
    url: XAI_RESPONSES_URL,
    method: "POST",
    headers: { Authorization: `Bearer ${p.apiKey}` },
    body: {
      model: p.model,
      input: [{ role: "user", content: p.prompt }],
      tools: [{ type: "x_search", allowed_x_handles: p.handles, from_date: p.fromDate, to_date: p.toDate }],
      max_turns: p.maxTurns,
    },
    schema: XaiResponse,
    fetchImpl: p.fetchImpl,
  });
}

export function createXaiClient(apiKey: string, model: string, fetchImpl?: typeof fetch): LlmClient {
  return {
    provider: "xai",
    model,
    async generateJson({ system, prompt }: LlmJsonRequest) {
      const res = await requestJson({
        url: XAI_RESPONSES_URL,
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
          model,
          input: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          text: { format: { type: "json_object" } },
        },
        schema: XaiResponse,
        fetchImpl,
      });
      return outputText(res);
    },
  };
}
