import type { Validation } from "../../../src/bul/agents";

const LABEL: Record<Validation["status"], string> = { pass: "OK", warn: "Atención", fail: "Falla", "n/a": "N/A" };

export function Status({ status }: { status: Validation["status"] }) {
  return <span className={`status status-${status.replace("/", "")}`}>{LABEL[status]}</span>;
}
