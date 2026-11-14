import { submitSignup } from "./signup";

const ENDPOINT = "https://formspree.io/f/abcdwxyz";
const respond = (status: number) => jest.fn().mockResolvedValue(new Response("{}", { status })) as unknown as typeof fetch;

describe("submitSignup", () => {
  it("posts a normalized, minimal payload to the hosted form", async () => {
    const fetchImpl = respond(200);
    await expect(submitSignup({ contact: " Ana@Example.org ", consent: true, endpoint: ENDPOINT, fetchImpl })).resolves.toEqual({ ok: true });
    const [url, init] = (fetchImpl as unknown as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    expect(JSON.parse(init.body as string)).toEqual({ contact: "ana@example.org", kind: "email", consent: true, source: "rdc-site" });
  });

  it("does nothing when sign-ups are closed or the endpoint is not allowlisted", async () => {
    const fetchImpl = respond(200);
    for (const endpoint of ["", "https://evil.test/f/abcdwxyz", "http://formspree.io/f/abcdwxyz"]) {
      await expect(submitSignup({ contact: "a@b.co", consent: true, endpoint, fetchImpl })).resolves.toEqual({ ok: false, reason: "not_configured" });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("validates before touching the network", async () => {
    const fetchImpl = respond(200);
    await expect(submitSignup({ contact: "nope nope", consent: true, endpoint: ENDPOINT, fetchImpl })).resolves.toEqual({ ok: false, reason: "invalid_contact" });
    await expect(submitSignup({ contact: "a@b.co", consent: false, endpoint: ENDPOINT, fetchImpl })).resolves.toEqual({ ok: false, reason: "consent_required" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("answers a bot that filled the honeypot as if it worked, without sending anything", async () => {
    const fetchImpl = respond(200);
    await expect(submitSignup({ contact: "a@b.co", consent: true, website: "spam", endpoint: ENDPOINT, fetchImpl })).resolves.toEqual({ ok: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports a refusal and a network failure without leaking the contact", async () => {
    const refused = await submitSignup({ contact: "secret@example.org", consent: true, endpoint: ENDPOINT, fetchImpl: respond(422) });
    expect(refused).toEqual({ ok: false, reason: "rejected", status: 422 });
    const down = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    const network = await submitSignup({ contact: "secret@example.org", consent: true, endpoint: ENDPOINT, fetchImpl: down });
    expect(network).toEqual({ ok: false, reason: "network" });
    expect(JSON.stringify([refused, network])).not.toContain("secret");
  });
});
