import { useEffect, useState } from "react";

const DEADLINE = Date.parse("2026-11-14T23:59:00Z");
const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

function parts(now: number) {
  const left = Math.max(0, DEADLINE - now);
  const sec = Math.floor(left / 1000);
  return {
    days: pad(Math.floor(sec / 86400)),
    hrs: pad(Math.floor((sec % 86400) / 3600)),
    mins: pad(Math.floor((sec % 3600) / 60)),
    secs: pad(sec % 60),
    done: left <= 0,
  };
}

export function Countdown() {
  const [t, setT] = useState(() => parts(Date.now()));
  useEffect(() => {
    const id = window.setInterval(() => setT(parts(Date.now())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="count" aria-live="polite">
      <span className="count-label">{t.done ? "Entrega cerrada" : "Entrega 14 nov 23:59 UTC"}</span>
      <ol>
        {([["days", t.days], ["hrs", t.hrs], ["mins", t.mins], ["secs", t.secs]] as const).map(([k, v]) => (
          <li key={k}>
            <strong>{v}</strong>
            <em>{k}</em>
          </li>
        ))}
      </ol>
    </div>
  );
}
