import { readdirSync } from "node:fs";
import { BISON_DATASETS } from "../../schemas/bison";
import { CostGuardError, loadQuery, runGuarded, type BqBackend } from "./client";

const fakeBackend = (bytes: number) => {
  const run = jest.fn<ReturnType<BqBackend["run"]>, Parameters<BqBackend["run"]>>().mockResolvedValue([{ date: "2026-11-01" }]);
  const backend: BqBackend = { dryRun: jest.fn().mockResolvedValue(bytes), run };
  return { backend, run };
};

describe("BigQuery queries", () => {
  const files = readdirSync("src/bison/bq/queries").map((f) => f.replace(/\.sql$/, ""));

  it.each(files)("%s filters on block_date partitions", (id) => {
    expect(() => loadQuery(id)).not.toThrow();
  });

  it("has a query for every BigQuery dataset", () => {
    const bqIds = Object.keys(BISON_DATASETS).filter((id) => id !== "intents_daily");
    for (const id of bqIds) expect(files).toContain(id);
  });

  it("rejects ids that could escape the queries folder", () => {
    expect(() => loadQuery("../../../package")).toThrow(/Invalid query id/);
  });
});

describe("runGuarded", () => {
  it("dry-runs and refuses queries above the byte cap", async () => {
    const { backend, run } = fakeBackend(5_000);
    await expect(runGuarded(backend, "daily_activity", {}, {}, 1_000)).rejects.toBeInstanceOf(CostGuardError);
    expect(run).not.toHaveBeenCalled();
  });

  it("runs with maximumBytesBilled when under the cap", async () => {
    const { backend, run } = fakeBackend(500);
    const res = await runGuarded(backend, "daily_activity", { start_date: "2026-10-01" }, { start_date: "DATE" }, 1_000);
    expect(res.bytesProcessed).toBe(500);
    expect(run.mock.calls[0]?.[3]).toBe(1_000);
  });
});
