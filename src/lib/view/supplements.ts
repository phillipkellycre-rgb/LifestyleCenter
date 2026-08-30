import type { Db, SupplementFrequency } from "@/lib/domain/types";

export const SUPPLEMENT_FREQUENCIES: SupplementFrequency[] = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "As needed",
];

export function supplementTarget(freq: SupplementFrequency): number {
  if (freq === "Twice daily") return 2;
  if (freq === "Three times daily") return 3;
  return 1;
}

export interface SupplementRowVM {
  id: string;
  name: string;
  amount: string;
  frequency: SupplementFrequency;
  taken: number;
  target: number;
  done: boolean;
}

export function supplementsView(db: Db, dateStr: string): SupplementRowVM[] {
  const log = (db.supplementLog || {})[dateStr] || {};
  return (db.supplements || []).map((s) => {
    const target = supplementTarget(s.frequency);
    const taken = log[s.id] || 0;
    return {
      id: s.id,
      name: s.name,
      amount: s.amount,
      frequency: s.frequency,
      taken,
      target,
      done: taken >= target,
    };
  });
}
