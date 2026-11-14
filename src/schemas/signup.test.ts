import { isAllowedSignupEndpoint, parseContact, SignupInput, SignupPayload } from "./signup";

describe("parseContact", () => {
  it.each([
    ["Ana@Example.ORG", { kind: "email", value: "ana@example.org" }],
    ["  ana+nr@sub.example.org ", { kind: "email", value: "ana+nr@sub.example.org" }],
    ["@near", { kind: "x", value: "@near" }],
    ["near_protocol", { kind: "x", value: "@near_protocol" }],
  ])("accepts %s", (raw, expected) => {
    expect(parseContact(raw)).toEqual(expected);
  });

  it.each([
    "",
    "   ",
    "two words",
    "a@b",
    "@@near",
    "@this_handle_is_too_long",
    "ana@example.org\nbcc:evil@example.org",
    "<script>alert(1)</script>",
    `${"a".repeat(250)}@example.org`,
    "https://x.com/near",
  ])("rejects %j", (raw) => {
    expect(parseContact(raw)).toBeNull();
  });
});

describe("isAllowedSignupEndpoint", () => {
  it("only accepts Formspree form URLs over https", () => {
    expect(isAllowedSignupEndpoint("https://formspree.io/f/abcdwxyz")).toBe(true);
    for (const bad of ["", "http://formspree.io/f/abcdwxyz", "https://formspree.io.evil.test/f/abcdwxyz", "https://evil.test/f/abcdwxyz", "https://formspree.io/f/ab", "https://formspree.io/f/abcdwxyz?x=1", "javascript:alert(1)"]) {
      expect(isAllowedSignupEndpoint(bad)).toBe(false);
    }
  });
});

describe("signup schemas", () => {
  it("requires explicit consent and an empty honeypot", () => {
    expect(SignupInput.safeParse({ contact: "a@b.co", consent: true }).success).toBe(true);
    expect(SignupInput.safeParse({ contact: "a@b.co", consent: false }).success).toBe(false);
    expect(SignupInput.safeParse({ contact: "a@b.co", consent: true, website: "http://spam" }).success).toBe(false);
  });

  it("the outgoing payload carries only the contact, its kind, consent and the source", () => {
    const payload = SignupPayload.parse({ contact: "a@b.co", kind: "email", consent: true, source: "rdc-site", extra: "dropped" });
    expect(Object.keys(payload).sort()).toEqual(["consent", "contact", "kind", "source"]);
  });
});
