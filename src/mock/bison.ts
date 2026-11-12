import { addDays, daysBetween, parseDay } from "../lib/dates";
import type { Rng } from "./prng";

/**
 * Best-case synthetic scenario (SIMULATED, not NEAR data):
 * 1Click volume grows faster than base activity and leads daily active accounts by ~7 days;
 * one airdrop-like spike concentrated in a few signers exercises the "spike vs structural change" classifier.
 */
export function mockBison(rng: Rng, end: string, bqDays: number, intentsDays: number) {
  const start = addDays(end, -bqDays);
  const days = daysBetween(start, end);
  const intentsStart = addDays(end, -intentsDays);
  const spikeDay = addDays(end, -40);
  const weekday = (d: string) => [0.86, 1, 1.04, 1.05, 1.04, 1.02, 0.9][parseDay(d).getUTCDay()] ?? 1;

  let shock = 0;
  const intentsLevel = days.map((_, i) => {
    shock = 0.8 * shock + rng.between(-0.09, 0.09);
    return (1 + 0.009 * i + 0.00002 * i * i) * Math.exp(shock);
  });
  const lag = 7;
  const mirageFrom = addDays(end, -14);
  const mirageTo = addDays(end, -7);

  const daily_activity = [];
  const tx_status = [];
  const new_accounts = [];
  const contract_activity = [];
  const concentration = [];
  const meta_tx = [];
  const contract_usage = [];
  const intents_daily = [];

  for (const [i, date] of days.entries()) {
    const lead = intentsLevel[Math.max(0, i - lag)] ?? 1;
    const isSpike = date === spikeDay;
    const mirageDip = date >= mirageFrom && date < mirageTo ? 0.93 : 1;
    const daa = Math.round(400_000 * (0.4 + 0.6 * lead) * weekday(date) * rng.noise(0.01) * mirageDip * (isSpike ? 2.6 : 1));
    const txs = Math.round(daa * rng.between(5.5, 6.5) * (isSpike ? 1.8 : 1));
    daily_activity.push({ date, daily_active_accounts: daa, transactions: txs });
    const failures = Math.round(txs * rng.between(0.01, 0.025));
    tx_status.push({ date, status: "SUCCESS", transactions: txs - failures }, { date, status: "FAILURE", transactions: failures });
    new_accounts.push({ date, new_accounts: Math.round(daa * rng.between(0.04, 0.06) * (isSpike ? 4 : 1)) });

    const calls = Math.round(txs * rng.between(1.6, 1.9));
    const intentsShare = 0.04 + 0.08 * ((intentsLevel[i] ?? 1) - 1) / 2.5;
    contract_activity.push({
      date,
      function_calls: calls,
      active_contracts: Math.round(rng.between(5200, 5800) * (0.8 + 0.2 * lead)),
      deploys: rng.int(60, 140),
      intents_calls: Math.round(calls * intentsShare * rng.noise(0.05)),
    });
    const top10 = Math.round(txs * (isSpike ? 0.58 : rng.between(0.1, 0.15)));
    concentration.push({ date, top10_transactions: top10, total_transactions: txs });
    const actions = Math.round(calls * 1.3);
    const delegate = Math.round(actions * (0.03 + 0.0002 * i) * rng.noise(0.05));
    meta_tx.push({ date, delegate_actions: delegate, delegating_accounts: Math.round(delegate * 0.35), total_actions: actions });

    const contracts: [string, number][] = [
      ["mock-intents.near", 0.12 + intentsShare],
      ["mock-dex.near", 0.1],
      ["mock-game.near", 0.08],
      ["mock-social.near", 0.05],
      ["mock-lending.near", 0.03],
    ];
    for (const [contract, share] of contracts) {
      const c = Math.round(calls * share * rng.noise(0.08));
      contract_usage.push({ date, contract, calls: c, distinct_callers: Math.round(c * rng.between(0.05, 0.12)) });
    }

    if (date >= intentsStart) {
      const swaps = Math.round(9_000 * (intentsLevel[i] ?? 1) * weekday(date) * rng.noise(0.02));
      const missing = rng.int(0, Math.round(swaps * 0.003));
      intents_daily.push({
        date,
        swaps,
        volume_usd: Math.round(swaps * rng.between(350, 450) * 100) / 100,
        swaps_missing_usd: missing,
        cross_chain_swaps: Math.round(swaps * rng.between(0.7, 0.8)),
      });
    }
  }

  return { start, days, datasets: { daily_activity, tx_status, new_accounts, contract_usage, contract_activity, concentration, meta_tx, intents_daily } };
}
