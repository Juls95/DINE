import type { Validation } from "../../../src/bul/agents";

const LABEL: Record<Validation["status"], string> = { pass: "OK", warn: "Warning", fail: "Fail", "n/a": "N/A" };

export function Status({ status }: { status: Validation["status"] }) {
  return <span className={`status status-${status.replace("/", "")}`}>{LABEL[status]}</span>;
}
