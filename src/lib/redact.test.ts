import { REDACTED, redactDeep, redactHeaders, redactString } from "./redact";

describe("redact", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJl";

  it("removes bearer tokens, JWTs and key query params from strings", () => {
    const out = redactString(`Bearer abc123 ${jwt} https://x.test/?key=secret&other=1`);
    expect(out).not.toMatch(/abc123|secret|eyJ/);
    expect(out).toContain("other=1");
  });

  it("redacts secret headers by name", () => {
    expect(redactHeaders({ Authorization: "Bearer t", "x-goog-api-key": "k", Accept: "json" })).toEqual({
      Authorization: REDACTED,
      "x-goog-api-key": REDACTED,
      Accept: "json",
    });
  });

  it("redacts nested secret keys and leaves data intact", () => {
    expect(redactDeep({ request: { api_key: "k", rows: [1, 2] }, note: jwt })).toEqual({
      request: { api_key: REDACTED, rows: [1, 2] },
      note: REDACTED,
    });
  });
});
