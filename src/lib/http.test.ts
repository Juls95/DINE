import { z } from "zod";
import { requestJson } from "./http";

const schema = z.object({ ok: z.boolean() });
const okFetch = (): typeof fetch => jest.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;

describe("requestJson", () => {
  it("refuses to send credentials over a non-https URL before any network call", async () => {
    const fetchImpl = okFetch();
    await expect(
      requestJson({ url: "http://api.example.org/x?token=abc", headers: { Authorization: "Bearer secret" }, schema, fetchImpl }),
    ).rejects.toThrow(/non-https/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps query secrets out of error messages", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response("{}", { status: 500 })) as unknown as typeof fetch;
    await expect(requestJson({ url: "https://api.example.org/x?api_key=topsecret&q=1", schema, fetchImpl })).rejects.toThrow(/\[REDACTED\]/);
    await expect(requestJson({ url: "https://api.example.org/x?api_key=topsecret", schema, fetchImpl })).rejects.not.toThrow(/topsecret/);
  });

  it("returns validated data over https", async () => {
    await expect(requestJson({ url: "https://api.example.org/x", schema, fetchImpl: okFetch() })).resolves.toEqual({ ok: true });
  });

  it("fails fast on a schema mismatch", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response(JSON.stringify({ ok: "yes" }), { status: 200 })) as unknown as typeof fetch;
    await expect(requestJson({ url: "https://api.example.org/x", schema, fetchImpl })).rejects.toThrow(/schema mismatch/);
  });
});
