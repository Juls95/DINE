import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { CSP, SECURITY_HEADERS } from "./security-headers";

type RenderYaml = { services: { headers?: { path: string; name: string; value: string }[] }[] };

describe("security headers", () => {
  const render = parse(readFileSync("render.yaml", "utf8")) as RenderYaml;
  const headers = Object.fromEntries((render.services[0]?.headers ?? []).filter((h) => h.path === "/*").map((h) => [h.name, h.value]));

  it("render.yaml carries exactly the headers the preview server uses", () => {
    expect(headers).toEqual(SECURITY_HEADERS);
  });

  it("the CSP forbids inline and eval scripts, plugins, framing and base-tag hijacking", () => {
    expect(CSP).toMatch(/script-src 'self'(;|$)/);
    expect(CSP).not.toMatch(/unsafe-eval|script-src[^;]*unsafe-inline/);
    for (const d of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'"]) expect(CSP).toContain(d);
  });

  it("only the build-time Notion token is a secret and nothing secret is committed with a value", () => {
    const text = readFileSync("render.yaml", "utf8");
    expect(text).toMatch(/key: NOTION_TOKEN\n\s+sync: false/);
    expect(text).not.toMatch(/ntn_|secret_[A-Za-z0-9]{20}/);
  });
});
