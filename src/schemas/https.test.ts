import { HttpsUrl } from "./common";
import { BearyNotionHit } from "./beary";

describe("HttpsUrl", () => {
  it.each(["https://x.com/near/status/1", "https://example.org/a?b=c"])("accepts %s", (url) => {
    expect(HttpsUrl.safeParse(url).success).toBe(true);
  });

  it.each(["javascript:alert(1)", "data:text/html,<script>1</script>", "http://example.org", "ftp://example.org", "not a url", ""])(
    "rejects %s",
    (url) => {
      expect(HttpsUrl.safeParse(url).success).toBe(false);
    },
  );

  it("is enforced on exported Notion hits", () => {
    const hit = { source: "tickers_info", page_id: "1", title: "t", date: null, sentiment: null, account: null, topic: null, excerpt: "e" };
    expect(BearyNotionHit.safeParse({ ...hit, url: null }).success).toBe(true);
    expect(BearyNotionHit.safeParse({ ...hit, url: "javascript:alert(1)" }).success).toBe(false);
  });
});
