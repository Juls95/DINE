export type LlmJsonRequest = {
  system: string;
  prompt: string;
};

export interface LlmClient {
  readonly provider: "gemini" | "xai";
  readonly model: string;
  /** Returns raw model text that is expected to be a JSON document; callers validate it with zod. */
  generateJson(req: LlmJsonRequest): Promise<string>;
}
