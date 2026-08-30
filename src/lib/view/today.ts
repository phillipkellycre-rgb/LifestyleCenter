import { EXERCISES, RECIPES } from "@/lib/data";
import { computeTargets } from "@/lib/domain/calc";
import { phaseFor } from "@/lib/domain/program";
import { progression } from "@/lib/domain/progression";
import { adherence, currentWeek, dayTotals, exerciseName, isBeforeStart, isRestDay, today, todayPlan } from "@/lib/domain/selectors";
import { fmt, formatIsoDate } from "@/lib/domain/util";
import type { Db, MealSlot } from "@/lib/domain/types";

export interface TodayExerciseVM {
  exId: number;
  name: string;
  meta: string;
  load: string;
  loadUnit: string;
  pct: number;
  done: boolean;
}

export interface TodayMealVM {
  slot: MealSlot;
  slotLabel: string;
  name: string;
  kcal: string;
  opacity: number;
  p: string;
  c: string;
  f: string;
  logged: boolean;
  logCandidate: { name: string; cal: number; p: number; c: number; f: number } | null;
}

export interface TodayVM {
  workoutTag: string;
  fuelTag: string;
  startLabel: string;
  startDisabled: boolean;
  restDay: boolean;
  exercises: TodayExerciseVM[];
  meals: TodayMealVM[];
  waterLine: string;
  waterPct: number;
  coachNote: string;
}

export const WATER_STEPS = [8, 12, 16, 24];

export function todayView(db: Db): TodayVM {
  const t = computeTargets(db.profile);
  const dateStr = today();
  const tot = dayTotals(db, dateStr);
  const a = adherence(db);
  const week = currentWeek(db);
  const phase = phaseFor(week);
  const plan = todayPlan(db);
  const doneToday = db.history.filter((s) => s.date === dateStr);
  const completed = db.completedToday || [];
  const water = (db.water || {})[dateStr] || 0;
  const beforeStart = isBeforeStart(db, dateStr);
  const restDay = isRestDay(db, dateStr);

  const exercises: TodayExerciseVM[] = plan.exercises.map((pe) => {
    const pr = progression(pe, phase, db.history);
    const done = completed.indexOf(pe.exId) >= 0 || doneToday.some((s) => s.entries.some((e) => e.exId === pe.exId));
    const group = EXERCISES[pe.exId]?.group ?? "";
    return {
      exId: pe.exId,
      name: exerciseName(pe.exId),
      meta: `${pr.sets} sets · ${pe.repLow}–${pe.repHigh} reps · ${group}`,
      load: pr.weight ? String(pr.weight) : "BW",
      loadUnit: `LB × ${pr.reps}`,
      pct: done ? 1 : 0,
      done,
    };
  });

  const todayIdx = (new Date().getDay() + 6) % 7;
  const mealDay = db.mealPlan[todayIdx] || db.mealPlan[0];
  const meals: TodayMealVM[] = mealDay.meals.map((m) => {
    const r = RECIPES[m.recipeId];
    const logged = (db.foodLog[dateStr] || {})[m.slot] || [];
    const has = logged.length > 0;
    const kcal = has ? logged.reduce((x, i) => x + i.cal, 0) : r.cal;
    return {
      slot: m.slot,
      slotLabel: `${m.slot.toUpperCase()} · ${has ? "LOGGED" : "PLANNED"}`,
      name: has ? logged.map((i) => i.name).join(", ") : r.name,
      kcal: fmt(kcal),
      opacity: has ? 1 : 0.62,
      p: `${has ? Math.round(logged.reduce((x, i) => x + i.p, 0)) : r.p}g`,
      c: `${has ? Math.round(logged.reduce((x, i) => x + i.c, 0)) : r.c}g`,
      f: `${has ? Math.round(logged.reduce((x, i) => x + i.f, 0)) : r.f}g`,
      logged: has,
      logCandidate: has ? null : { name: r.name, cal: r.cal, p: r.p, c: r.c, f: r.f },
    };
  });

  const noteBits: string[] = [];
  if (a.sessions >= a.planned) noteBits.push(`All ${a.planned} sessions banked this week — hold the line.`);
  else noteBits.push(`${a.sessions} of ${a.planned} sessions in; ${a.planned - a.sessions} left before Sunday.`);
  if (tot.p < t.protein * 0.8)
    noteBits.push(`Protein is short by ${Math.round(t.protein - tot.p)}g — a shake and 6oz of chicken closes it.`);
  else noteBits.push(`Protein is on pace at ${Math.round(tot.p)}g.`);
  if (phase === "Deload") noteBits.push("Deload week: loads at 85%, one fewer set. Let the fatigue clear.");

  const workoutTag = beforeStart
    ? `STARTS ${formatIsoDate(db.program.startDate).toUpperCase()}`
    : restDay
    ? "REST DAY"
    : `WK ${week} — ${plan.name.toUpperCase()}`;
  const startLabel = beforeStart
    ? `Program starts ${formatIsoDate(db.program.startDate)}`
    : doneToday.length
    ? "Session logged — open again"
    : restDay
    ? "Rest day — start anyway"
    : "Start workout";

  return {
    workoutTag,
    fuelTag: `${fmt(tot.cal)} / ${fmt(t.kcal)} KCAL`,
    startLabel,
    startDisabled: beforeStart,
    restDay,
    exercises,
    meals,
    waterLine: `${water} / 100 OZ`,
    waterPct: Math.min(1, water / 100),
    coachNote: `“${noteBits.join(" ")}”`,
  };
}
