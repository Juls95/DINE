import { loadEnv } from "../../config/env";
import { ANALYSES_FILTER, CREATIVE_FILTER, MIN_INTERVAL_MS, NOTION_API, PAGE_SIZE, TICKERS_FILTER, propertyText, queryDatabase } from "./client";
import { loadNotionConfig } from "./config";
import { ingestFromEnv } from "./ingest";
import { isNearTicker, mentionsNear } from "./match";
import { hitFromDesk, hitFromTicker, summarize } from "./summarize";

const title = (text: string) => ({ type: "title", title: [{ plain_text: text }] });
const rich = (text: string) => ({ type: "rich_text", rich_text: [{ plain_text: text }] });
const num = (n: number) => ({ type: "number", number: n });
const select = (name: string) => ({ type: "select", select: { name } });
const date = (start: string) => ({ type: "date", date: { start } });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("mentionsNear", () => {
  it.each([
    ["$NEAR", true],
    ["NEAR Protocol is a sharded layer-1", true],
    ["NEAR Intents exploit", true],
    ["Alianza NEAR x Brave", true],
    ["@NEARProtocol", true],
    ["NEAR -5.4%", true],
    ["nearly 20% in pre-market", false],
    ["near $100 par", false],
    ["nearest support", false],
    ["", false],
  ])("%j → %s", (text, expected) => expect(mentionsNear(text)).toBe(expected));

  it.each([
    ["NEAR", true],
    ["NEAR Intents", true],
    ["STRC", false],
    ["near $100 par", false],
  ])("isNearTicker(%j) → %s", (ticker, expected) => expect(isNearTicker(ticker)).toBe(expected));
});

describe("propertyText", () => {
  it("flattens title, rich_text, select, number and date", () => {
    expect(propertyText(title("NEAR"))).toBe("NEAR");
    expect(propertyText(rich("hello"))).toBe("hello");
    expect(propertyText(select("Positivo"))).toBe("Positivo");
    expect(propertyText(num(4.45))).toBe("4.45");
    expect(propertyText(date("2026-10-25T12:00:00.000Z"))).toBe("2026-10-25");
  });
});

describe("queryDatabase", () => {
  it("paginates with start_cursor, sends the token, and waits between pages", async () => {
    const first = Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: `p${i}`, properties: {} }));
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(json({ results: first, has_more: true, next_cursor: "cur-2" }))
      .mockResolvedValueOnce(json({ results: [{ id: "last", properties: {} }], has_more: false, next_cursor: null }));
    const sleep = jest.fn().mockResolvedValue(undefined);
    const out = await queryDatabase({
      token: "secret-notion-token",
      version: "2022-06-28",
      databaseId: "99687de2-cbd0-4b2e-9e1c-0dd0a3211357",
      filter: TICKERS_FILTER,
      fetchImpl,
      sleep,
    });
    expect(out).toHaveLength(PAGE_SIZE + 1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(`${NOTION_API}/databases/99687de2-cbd0-4b2e-9e1c-0dd0a3211357/query`);
    expect(fetchImpl.mock.calls[0]?.[1]?.headers.Authorization).toBe("Bearer secret-notion-token");
    expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body)).start_cursor).toBe("cur-2");
    expect(sleep).toHaveBeenCalledWith(MIN_INTERVAL_MS);
  });

  it("fails fast when the response shape changes", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(json({ unexpected: true }));
    await expect(
      queryDatabase({ token: "t", version: "2022-06-28", databaseId: "99687de2-cbd0-4b2e-9e1c-0dd0a3211357", fetchImpl, sleep: jest.fn() }),
    ).rejects.toThrow(/schema mismatch/);
  });
});

describe("hit mapping", () => {
  it("keeps the NEAR and NEAR Intents tickers and drops English near", () => {
    const near = hitFromTicker({
      id: "t1",
      url: "https://notion.so/t1",
      properties: {
        Ticker: title("NEAR"),
        Sector: rich("Crypto / Layer-1"),
        Price: num(4.45),
        "What it does": rich("NEAR Protocol is a sharded layer-1 blockchain."),
        LastNews: rich("2026-10-25: NEAR -5.4%"),
        Username: rich("Julian"),
      },
    });
    expect(near?.title).toBe("NEAR");
    expect(near?.excerpt).toContain("4.45");
    expect(near?.date).toBe("2026-10-25");

    const intents = hitFromTicker({
      id: "t2",
      properties: {
        Ticker: title("NEAR Intents"),
        Sector: rich("crypto"),
        "What it does": rich("Omni cross-chain intents"),
        LastNews: rich("2026-10-02: ~$3.8M Omni exploit"),
      },
    });
    expect(intents?.title).toBe("NEAR Intents");

    const falsePositive = hitFromTicker({
      id: "t3",
      properties: {
        Ticker: title("STRC"),
        LastNews: rich("Strategy bought back STRC near $100 par"),
      },
    });
    expect(falsePositive).toBeNull();
  });

  it("never publishes a Notion page URL or an e-mail address found in a private note", () => {
    const hit = hitFromDesk(
      {
        id: "p1",
        url: "https://www.notion.so/workspace/Private-page-0123456789abcdef",
        properties: {
          Título: title("@desk - NEAR note"),
          "Cuenta analizada": rich("@desk"),
          "Topic / Tema principal": rich("NEAR contact: analyst@example.org"),
          "Resumen ejecutivo": rich("NEAR setup. Write to analyst@example.org for the chart."),
        },
      },
      "x_account_analyses",
    );
    expect(hit?.url).toBeNull();
    expect(JSON.stringify(hit)).not.toMatch(/@example\.org|notion\.so/);
    expect(hit?.excerpt).toContain("[email]");
  });

  it("maps desk rows and ignores nearly-only copy", () => {
    const hit = hitFromDesk(
      {
        id: "a1",
        properties: {
          Título: title("@arkham - 26 Oct 2026"),
          "Cuenta analizada": rich("@arkham"),
          "Sentimiento general": select("Neutral"),
          "Topic / Tema principal": rich("Ballena Mk4 long de NEAR"),
          "Resumen ejecutivo": rich("La ballena Mk4 gana más de $10M con un long en NEAR."),
          "Fecha del análisis": date("2026-10-26"),
        },
      },
      "x_account_analyses",
    );
    expect(hit?.account).toBe("@arkham");
    expect(hit?.sentiment).toBe("neutral");
    expect(hit?.date).toBe("2026-10-26");

    expect(
      hitFromDesk(
        {
          id: "c1",
          properties: {
            Título: title("What Happened Today"),
            "Resumen ejecutivo": rich("CROX up nearly 20% in pre-market"),
            "Topic / Tema principal": rich("earnings"),
          },
        },
        "x_creative_output",
      ),
    ).toBeNull();
  });
});

describe("summarize", () => {
  it("counts sources, tallies sentiment and never invents figures", () => {
    const snap = summarize({
      mode: "live",
      generated_at: "2026-11-14T13:00:00.000Z",
      databases: {
        tickers_info: "99687de2-cbd0-4b2e-9e1c-0dd0a3211357",
        x_creative_output: "460be6fc-c001-4330-9832-c55f647c5c23",
        x_account_analyses: "bbaf87b8-dfa1-4cce-acb3-f4f69a0c383d",
      },
      scanned_pages: 5,
      discarded_false_positives: 2,
      hits: [
        {
          source: "tickers_info",
          page_id: "1",
          title: "NEAR Intents",
          date: "2026-10-02",
          sentiment: null,
          account: "Julian",
          topic: "crypto",
          excerpt: "Omni exploit ~$3.8M; pause then partial restore.",
          url: null,
        },
        {
          source: "x_account_analyses",
          page_id: "2",
          title: "@Zeneca - 16 Oct 2026",
          date: "2026-10-16",
          sentiment: "positive",
          account: "@Zeneca",
          topic: "NEAR x Brave",
          excerpt: "Alianza NEAR x Brave.",
          url: null,
        },
      ],
    });
    expect(snap.counts).toEqual({ tickers: 1, creative: 0, analyses: 1, scanned_pages: 5, discarded_false_positives: 2 });
    expect(snap.sentiment_tally.positive).toBe(1);
    expect(snap.themes.map((t) => t.id)).toEqual(expect.arrayContaining(["intents_security", "brave"]));
    expect(snap.paragraphs.join(" ")).toContain("discarding 2 false matches");
    expect(JSON.stringify(snap)).not.toMatch(/secret-notion|Bearer /);
  });
});

describe("ingestFromEnv", () => {
  it("queries the three databases and drops English-near false positives", async () => {
    const env = loadEnv({ DATA_MODE: "live", NOTION_VERSION: "2022-06-28" });
    const fetchImpl = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("99687de2")) {
        return json({
          results: [
            { id: "near", url: "https://notion.so/near", properties: { Ticker: title("NEAR"), "What it does": rich("sharded L1"), LastNews: rich("NEAR -5.4%") } },
            { id: "strc", properties: { Ticker: title("STRC"), LastNews: rich("near $100 par") } },
          ],
          has_more: false,
          next_cursor: null,
        });
      }
      if (String(url).includes("460be6fc")) {
        return json({
          results: [{ id: "c", properties: { Título: title("What Happened Today - 25 Oct 2026"), "Resumen ejecutivo": rich("NEAR -5.4%"), "Sentimiento general": select("Mixto"), "Fecha del análisis": date("2026-10-25") } }],
          has_more: false,
          next_cursor: null,
        });
      }
      return json({
        results: [{ id: "a", properties: { Título: title("@CastilloTrading"), "Cuenta analizada": rich("@CastilloTrading"), "Resumen ejecutivo": rich("longs en ZRO, HYPE, NEAR y ONDO"), "Sentimiento general": select("Positivo") } }],
        has_more: false,
        next_cursor: null,
      });
    });
    const snap = await ingestFromEnv({ env, token: "secret-notion-token", generatedAt: "2026-11-14T13:00:00.000Z", fetchImpl, sleep: async () => undefined });
    expect(snap.counts.tickers).toBe(1);
    expect(snap.counts.creative).toBe(1);
    expect(snap.counts.analyses).toBe(1);
    expect(snap.counts.discarded_false_positives).toBe(1);
    expect(snap.hits.map((h) => h.title)).toEqual(["NEAR", "What Happened Today - 25 Oct 2026", "@CastilloTrading"]);
    expect(CREATIVE_FILTER.or).toBeDefined();
    expect(ANALYSES_FILTER.or).toBeDefined();
  });
});

describe("loadNotionConfig", () => {
  it("lets env override database ids without storing a token", () => {
    const env = loadEnv({ NOTION_DB_TICKERS_INFO: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", NOTION_VERSION: "2022-06-28" });
    const cfg = loadNotionConfig(env, () =>
      [
        "version: '2022-06-28'",
        "databases:",
        "  tickers_info: '99687de2-cbd0-4b2e-9e1c-0dd0a3211357'",
        "  x_creative_output: '460be6fc-c001-4330-9832-c55f647c5c23'",
        "  x_account_analyses: 'bbaf87b8-dfa1-4cce-acb3-f4f69a0c383d'",
      ].join("\n"),
    );
    expect(cfg.databases.tickers_info).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(cfg.databases.x_creative_output).toBe("460be6fc-c001-4330-9832-c55f647c5c23");
    expect(JSON.stringify(cfg)).not.toMatch(/secret|token|ntn_/i);
  });
});
