import { z } from "zod";

export const DataMode = z.enum(["mock", "live"]);
export type DataMode = z.infer<typeof DataMode>;

/** Links published on the site must be https: a `javascript:` or `data:` URL from an external source must never reach an anchor. */
export const HttpsUrl = z.string().refine((value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "expected an https URL");

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
export const IsoWeek = z.string().regex(/^\d{4}-W\d{2}$/, "expected YYYY-Www");
