import createDebug from "debug";
import { redactDeep } from "./redact";

export type Logger = {
  info: (message: string, context?: unknown) => void;
  warn: (message: string, context?: unknown) => void;
  error: (message: string, context?: unknown) => void;
};

/** All logs go through `debug` (enable with DEBUG=rdc:*). Context is always redacted. */
export function createLogger(namespace: string): Logger {
  const base = createDebug(`rdc:${namespace}`);
  const warn = createDebug(`rdc:${namespace}:warn`);
  const error = createDebug(`rdc:${namespace}:error`);
  error.enabled = true;
  const fmt = (context: unknown) => (context === undefined ? "" : JSON.stringify(redactDeep(context)));
  return {
    info: (m, c) => base("%s %s", m, fmt(c)),
    warn: (m, c) => warn("%s %s", m, fmt(c)),
    error: (m, c) => error("%s %s", m, fmt(c)),
  };
}
