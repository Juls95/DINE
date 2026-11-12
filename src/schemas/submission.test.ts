import { SubmissionPayload } from "./submission";

const valid = {
  requestId: "4f0d8c8e-6a8f-4f6f-9d6b-2b3c4d5e6f70",
  projectName: "NEAR RDC",
  leadName: "Example Lead",
  email: "lead@example.com",
  size: "1",
  tracks: ["thesis"],
  nearAddress: "example.near",
  projectUrl: "https://github.com/example/repo",
  demoUrl: "https://example.onrender.com",
  idea: "Evidence-first investment thesis for NEAR built by three agents.",
  consent: true,
};

describe("SubmissionPayload", () => {
  it("accepts the documented contract", () => {
    expect(SubmissionPayload.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["the honeypot field", { website: "" }],
    ["consent false", { consent: false }],
    ["duplicate tracks", { tracks: ["thesis", "thesis"] }],
    ["unknown track", { tracks: ["research"] }],
    ["malformed NEAR account", { nearAddress: "Not A Near Account" }],
    ["non-http URL", { demoUrl: "ftp://example.com" }],
  ])("rejects %s", (_name, over) => {
    expect(SubmissionPayload.safeParse({ ...valid, ...over }).success).toBe(false);
  });
});
