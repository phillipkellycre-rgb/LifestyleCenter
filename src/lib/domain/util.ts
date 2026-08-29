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
