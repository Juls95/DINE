import { loadEnv, requireEnv } from "./env";

describe("loadEnv", () => {
  it("applies safe defaults", () => {
    const env = loadEnv({});
    expect(env.DATA_MODE).toBe("live");
    expect(env.LLM_PROVIDER).toBe("gemini");
    expect(env.BQ_MAX_BYTES).toBe(20_000_000_000);
  });

  it("switches the LLM provider with one env var", () => {
    expect(loadEnv({ LLM_PROVIDER: "xai" }).LLM_PROVIDER).toBe("xai");
  });

  it("fails fast on invalid values", () => {
    expect(() => loadEnv({ DATA_MODE: "prod" })).toThrow(/Invalid environment/);
    expect(() => loadEnv({ BQ_MAX_BYTES: "-1" })).toThrow(/Invalid environment/);
  });
});

describe("requireEnv", () => {
  it("names every missing variable", () => {
    expect(() => requireEnv(loadEnv({}), ["GCP_PROJECT_ID", "INTENTS_JWT"])).toThrow("GCP_PROJECT_ID, INTENTS_JWT");
  });

  it("returns the narrowed env when present", () => {
    const env = requireEnv(loadEnv({ INTENTS_JWT: "x" }), ["INTENTS_JWT"]);
    expect(env.INTENTS_JWT).toBe("x");
  });
});
