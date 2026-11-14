import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { Env } from "../../config/env";

export const NOTION_CONFIG_FILE = "config/beary.notion.yaml";

const NotionYaml = z.object({
  version: z.string().min(1).default("2022-06-28"),
  databases: z.object({
    tickers_info: z.string().uuid(),
    x_creative_output: z.string().uuid(),
    x_account_analyses: z.string().uuid(),
  }),
});

export type NotionConfig = {
  version: string;
  databases: z.infer<typeof NotionYaml>["databases"];
};

/** Database IDs live in yaml (not secret). Token and optional ID overrides come from env. */
export function loadNotionConfig(env: Env, readFile: (path: string) => string = (p) => readFileSync(p, "utf8")): NotionConfig {
  const yaml = NotionYaml.parse(parseYaml(readFile(NOTION_CONFIG_FILE)));
  return {
    version: env.NOTION_VERSION || yaml.version,
    databases: {
      tickers_info: env.NOTION_DB_TICKERS_INFO ?? yaml.databases.tickers_info,
      x_creative_output: env.NOTION_DB_X_CREATIVE ?? yaml.databases.x_creative_output,
      x_account_analyses: env.NOTION_DB_X_ANALYSES ?? yaml.databases.x_account_analyses,
    },
  };
}
