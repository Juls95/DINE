export function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

export function mean(xs: readonly number[]): number | null {
  return xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function sum(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current / previous - 1) * 100;
}

export function movingAverage(xs: readonly number[], window: number): (number | null)[] {
  return xs.map((_, i) => (i + 1 < window ? null : (mean(xs.slice(i + 1 - window, i + 1)) as number)));
}

export function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = mean(xs.slice(0, n)) as number;
  const my = mean(ys.slice(0, n)) as number;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = (xs[i] as number) - mx;
    const b = (ys[i] as number) - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  return dx === 0 || dy === 0 ? null : num / Math.sqrt(dx * dy);
}

/** Correlation of x[t] with y[t+lag] over aligned, non-null pairs. */
export function laggedCorrelation(x: readonly (number | null)[], y: readonly (number | null)[], lag: number) {
  const a: number[] = [];
  const b: number[] = [];
  for (let t = 0; t + lag < Math.min(x.length, y.length); t++) {
    const xv = x[t];
    const yv = y[t + lag];
    if (xv === null || xv === undefined || yv === null || yv === undefined) continue;
    a.push(xv);
    b.push(yv);
  }
  return { r: pearson(a, b), n: a.length };
}

/** Log-differences of a smoothed series: growth rates, so two trending series don't correlate just by trending. */
export function logDiff(xs: readonly (number | null)[], step: number): (number | null)[] {
  return xs.map((v, i) => {
    const prev = xs[i - step];
    if (v === null || v === undefined || prev === null || prev === undefined || v <= 0 || prev <= 0) return null;
    return Math.log(v / prev);
  });
}
