export const iso = (d: Date): string => d.toISOString().slice(0, 10);

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const round5 = (n: number): number => Math.max(0, Math.round(n / 5) * 5);

export const clamp = (n: number, a: number, b: number): number => Math.min(b, Math.max(a, n));

export const e1rm = (w: number, r: number): number => Math.round(w * (1 + r / 30));

export const fmt = (n: number): string => Math.round(n).toLocaleString();

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats a "YYYY-MM-DD" string as "Mon D" without going through Date parsing (avoids TZ drift). */
export function formatIsoDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_ABBR[m - 1]} ${d}`;
}

/**
 * Ordinary-least-squares line through (0,v0), (1,v1), ... — used for simple
 * personal trend lines (not a statistical or clinical forecast). `project(n)`
 * extrapolates n steps past the last point.
 */
export function linearTrend(values: number[]): { slope: number; intercept: number; project: (steps: number) => number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0, project: () => 0 };
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, v) => a + v, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((v, i) => {
    num += (i - xMean) * (v - yMean);
    den += (i - xMean) * (i - xMean);
  });
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept, project: (steps: number) => intercept + slope * (n - 1 + steps) };
}
