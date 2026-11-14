import { existsSync, readdirSync } from "node:fs";
import { z } from "zod";
import { dataRoot, readJson } from "../lib/files";
import { BISON_DATASETS, BisonManifest, DatasetFile, datasetFile, type BisonDatasetId } from "../schemas/bison";
import { BearyDaily, BearyNotionSnapshot, BearyWeekly } from "../schemas/beary";
import type { DataMode } from "../schemas/common";
import { DeskSnapshot, PriceSeries } from "../schemas/market";
import type { PriceData } from "./technical";

type Rows<K extends BisonDatasetId> = z.infer<(typeof BISON_DATASETS)[K]>[];
export type BisonData = { [K in BisonDatasetId]: Rows<K> };

export type Inputs = {
  mode: DataMode;
  manifest: BisonManifest;
  bison: BisonData;
  bearyDaily: BearyDaily[];
  bearyWeekly: BearyWeekly[];
  bearyNotion: BearyNotionSnapshot | null;
  desk: DeskSnapshot | null;
  /** Daily candles for NEAR and BTC. Null when no approved price source has been configured. */
  price: PriceData | null;
};

function readDir<T>(dir: string, schema: z.ZodType<T>): T[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => readJson(`${dir}/${f}`, schema));
}

/** Price candles need both symbols; one without the other is a configuration error, not "no data". */
function loadPrice(root: string): PriceData | null {
  const nearPath = `${root}/raw/price/near.json`;
  const btcPath = `${root}/raw/price/btc.json`;
  const hasNear = existsSync(nearPath);
  const hasBtc = existsSync(btcPath);
  if (!hasNear && !hasBtc) return null;
  if (hasNear !== hasBtc) throw new Error(`Price data needs both ${nearPath} and ${btcPath}`);
  return { near: readJson(nearPath, PriceSeries), btc: readJson(btcPath, PriceSeries) };
}

/** Loads every artifact for one mode and refuses to mix simulated and live data. */
export function loadInputs(mode: DataMode): Inputs {
  const root = dataRoot(mode);
  const manifest = readJson(`${root}/raw/manifest.json`, BisonManifest);
  const bison = {} as Record<BisonDatasetId, unknown[]>;
  for (const id of Object.keys(BISON_DATASETS) as BisonDatasetId[]) {
    const file = readJson(datasetFile(root, id), DatasetFile(BISON_DATASETS[id]));
    if (file.mode !== mode) throw new Error(`${id} is ${file.mode} data but the build runs in ${mode} mode`);
    bison[id] = file.rows;
  }
  const bearyDaily = readDir(`${root}/beary/daily`, BearyDaily);
  const bearyWeekly = readDir(`${root}/beary/weekly`, BearyWeekly);
  const notionPath = `${root}/beary/notion/near.json`;
  const bearyNotion = existsSync(notionPath) ? readJson(notionPath, BearyNotionSnapshot) : null;
  const deskPath = `${root}/beary/desk/near.json`;
  const desk = existsSync(deskPath) ? readJson(deskPath, DeskSnapshot) : null;
  const price = loadPrice(root);
  const mixed = [manifest, ...bearyDaily, ...bearyWeekly, ...(bearyNotion ? [bearyNotion] : []), ...(desk ? [desk] : []), ...(price ? [price.near, price.btc] : [])].find((a) => a.mode !== mode);
  if (mixed) throw new Error(`Found ${mixed.mode} artifact while building in ${mode} mode`);
  return { mode, manifest, bison: bison as BisonData, bearyDaily, bearyWeekly, bearyNotion, desk, price };
}
