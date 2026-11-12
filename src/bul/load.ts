import { existsSync, readdirSync } from "node:fs";
import { z } from "zod";
import { dataRoot, readJson } from "../lib/files";
import { BISON_DATASETS, BisonManifest, DatasetFile, datasetFile, type BisonDatasetId } from "../schemas/bison";
import { BearyDaily, BearyWeekly } from "../schemas/beary";
import type { DataMode } from "../schemas/common";

type Rows<K extends BisonDatasetId> = z.infer<(typeof BISON_DATASETS)[K]>[];
export type BisonData = { [K in BisonDatasetId]: Rows<K> };

export type Inputs = {
  mode: DataMode;
  manifest: BisonManifest;
  bison: BisonData;
  bearyDaily: BearyDaily[];
  bearyWeekly: BearyWeekly[];
};

function readDir<T>(dir: string, schema: z.ZodType<T>): T[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => readJson(`${dir}/${f}`, schema));
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
  const mixed = [manifest, ...bearyDaily, ...bearyWeekly].find((a) => a.mode !== mode);
  if (mixed) throw new Error(`Found ${mixed.mode} artifact while building in ${mode} mode`);
  return { mode, manifest, bison: bison as BisonData, bearyDaily, bearyWeekly };
}
