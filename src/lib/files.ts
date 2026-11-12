import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { z } from "zod";

export function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeText(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

export function readJson<T>(path: string, schema: z.ZodType<T>): T {
  if (!existsSync(path)) throw new Error(`Missing artifact: ${path}`);
  const parsed = schema.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) throw new Error(`Artifact ${path} failed validation: ${parsed.error.message}`);
  return parsed.data;
}

export function toCsv(rows: readonly Record<string, string | number | boolean | null>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0] as object);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
}

/** Root folder for raw/derived artifacts; mock and live never share a folder. */
export function dataRoot(mode: "mock" | "live"): string {
  return mode === "mock" ? "data/mock" : "data";
}
