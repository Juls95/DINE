import { mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeJson } from "../lib/files";
import type { BisonDatasetId } from "../schemas/bison";
import { buildMockInputs } from "../mock/run";
import { loadInputs } from "./load";

const ROOT = "data/mock";
const originalCwd = process.cwd();
let dir = "";

/** Persists the mock scenario exactly like `pnpm demo` does, but into a throwaway directory. */
function persist(): void {
  const inputs = buildMockInputs(ROOT);
  for (const item of inputs.manifest.items) {
    writeJson(item.file, { mode: "mock", id: item.id, rows: inputs.bison[item.id as BisonDatasetId] });
  }
  writeJson(`${ROOT}/raw/manifest.json`, inputs.manifest);
  for (const d of inputs.bearyDaily) writeJson(`${ROOT}/beary/daily/${d.date}.json`, d);
  for (const w of inputs.bearyWeekly) writeJson(`${ROOT}/beary/weekly/${w.week}.json`, w);
  writeJson(`${ROOT}/beary/notion/near.json`, inputs.bearyNotion);
  writeJson(`${ROOT}/beary/desk/near.json`, inputs.desk);
  writeJson(`${ROOT}/raw/price/near.json`, inputs.price?.near);
  writeJson(`${ROOT}/raw/price/btc.json`, inputs.price?.btc);
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "rdc-load-"));
  process.chdir(dir);
  persist();
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(dir, { recursive: true, force: true });
});

describe("loadInputs", () => {
  it("round-trips the persisted mock scenario including desk notes and candles", () => {
    const loaded = loadInputs("mock");
    const built = buildMockInputs(ROOT);
    expect(loaded.desk).toEqual(built.desk);
    expect(loaded.bearyNotion).toEqual(built.bearyNotion);
    expect(loaded.price).toEqual(built.price);
  });

  it("treats a missing price source as 'no data' rather than an error", () => {
    unlinkSync(`${ROOT}/raw/price/near.json`);
    unlinkSync(`${ROOT}/raw/price/btc.json`);
    expect(loadInputs("mock").price).toBeNull();
  });

  it("fails fast when only one of the two price files exists", () => {
    unlinkSync(`${ROOT}/raw/price/btc.json`);
    expect(() => loadInputs("mock")).toThrow(/needs both/);
  });

  it("refuses a simulated desk file when it is read as live data", () => {
    const live = buildMockInputs(ROOT);
    // The live directory carries simulated Bison files, which must be rejected before anything else is read.
    writeJson("data/raw/manifest.json", { ...live.manifest, mode: "live" });
    for (const item of live.manifest.items) {
      writeJson(item.file.replace("data/mock", "data"), { mode: "live", id: item.id, rows: live.bison[item.id as BisonDatasetId] });
    }
    writeJson("data/beary/desk/near.json", live.desk);
    expect(() => loadInputs("live")).toThrow(/mock artifact while building in live mode/);
  });
});
