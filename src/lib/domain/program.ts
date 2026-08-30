import { SPLITS, exByName } from "@/lib/data";
import { iso, round5 } from "./util";
import type { Exercise, MuscleGroup, Phase, Profile, Program, ProgramDay } from "./types";

const GROUP_BASE: Record<MuscleGroup, number> = {
  Chest: 0.55,
  Back: 0.6,
  Shoulders: 0.35,
  Biceps: 0.18,
  Triceps: 0.22,
  Quads: 0.85,
  Hamstrings: 0.55,
  Glutes: 0.8,
  Calves: 0.5,
  Core: 0.15,
  "Full body": 0.35,
};

/** A sensible even spread of weekdays for a given days-per-week count. */
export function defaultWorkoutDays(n: 3 | 4 | 5): number[] {
  if (n === 3) return [1, 3, 5]; // Mon/Wed/Fri
  if (n === 4) return [1, 2, 4, 5]; // Mon/Tue/Thu/Fri
  return [1, 2, 3, 4, 5]; // Mon-Fri
}

/** Seed working weight for an exercise, scaled off bodyweight by muscle group and equipment. */
export function seedWeightFor(ex: Exercise, bodyweight: number): number {
  const base = GROUP_BASE[ex.group] ?? 0.4;
  const mult = ex.compound ? 1 : 0.55;
  if (ex.equip === "Bodyweight") return 0;
  if (ex.equip === "Dumbbells") return round5(bodyweight * base * mult * 0.4);
  return round5(bodyweight * base * mult);
}

/**
 * Builds a 12-week program for the profile's day split. Pass the existing
 * program's startDate when regenerating (e.g. after a profile change) so the
 * user's week count isn't reset; omit it to start a brand-new program today.
 */
export function buildProgram(profile: Profile, startDate?: string): Program {
  const days = (Math.min(5, Math.max(3, profile.daysPerWeek || 4)) as 3 | 4 | 5);
  const split = SPLITS[days];
  const bw = profile.weight || 185;
  const title =
    days === 3 ? "12-Week Full Body" : days === 4 ? "12-Week Upper / Lower" : "12-Week Push Pull Legs";
  const programDays: ProgramDay[] = split.map(([name, list], di) => ({
    name,
    dayIndex: di,
    exercises: list.map((n) => {
      const ex = exByName[n];
      const rl = ex.compound ? 6 : 10;
      const rh = ex.compound ? 8 : 14;
      return { exId: ex.id, sets: 3, repLow: rl, repHigh: rh, weight: seedWeightFor(ex, bw) };
    }),
  }));
  return {
    title,
    weeks: 12,
    startDate: startDate ?? iso(new Date()),
    days: programDays,
  };
}

/** Every 4th week is a Deload; otherwise Foundation (1-4) / Overload (5-8) / Intensify (9-12). */
export function phaseFor(week: number): Phase {
  if (week % 4 === 0) return "Deload";
  if (week <= 4) return "Foundation";
  if (week <= 8) return "Overload";
  return "Intensify";
}
