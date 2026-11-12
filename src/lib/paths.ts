import { resolve } from "node:path";

/** Every command runs from the repo root (pnpm scripts, CI, Render), so source assets resolve from cwd. */
export const repoPath = (...parts: string[]) => resolve(process.cwd(), ...parts);

export const isMain = (relativeFile: string) => Boolean(process.argv[1]) && resolve(process.argv[1] ?? "") === repoPath(relativeFile);
