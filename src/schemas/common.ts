import { z } from "zod";

export const DataMode = z.enum(["mock", "live"]);
export type DataMode = z.infer<typeof DataMode>;

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
export const IsoWeek = z.string().regex(/^\d{4}-W\d{2}$/, "expected YYYY-Www");
