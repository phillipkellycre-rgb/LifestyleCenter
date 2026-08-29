import { EXERCISES } from "@/lib/data";
import { computeTargets } from "./calc";
import { phaseFor } from "./program";
import { addDays, clamp, e1rm, iso } from "./util";
import type { Db, ProgramDay, Session, Targets } from "./types";

export function targetsOf(db: Db): Targets {
  return computeTargets(db.profile);
}

export function today(): string {
  return iso(new Date());
}

export function currentWeek(db: Db): number {
  const start = new Date(db.program.startDate);
  const wk = Math.floor((Date.now() - start.getTime()) / (7 * 864e5)) + 1;
  return clamp(wk, 1, 12);
}

export function todayDayIndex(db: Db): number {
  const t = today();
  const done = db.history.filter((s) => s.date === t);
  if (done.length) return done[done.length - 1].dayIndex;
  const last = db.history[db.history.length - 1];
  return last ? (last.dayIndex + 1) % db.program.days.length : 0;
}

export function todayPlan(db: Db): ProgramDay {
  return db.program.days[todayDayIndex(db)];
}

export function dayTotals(db: Db, date: string) {
  const log = (db.foodLog || {})[date] || ({} as Db["foodLog"][string]);
  const t = { cal: 0, p: 0, c: 0, f: 0 };
  (["Breakfast", "Lunch", "Snack", "Dinner"] as const).forEach((s) =>
    (log[s] || []).forEach((i) => {
      t.cal += i.cal;
      t.p += i.p;
      t.c += i.c;
      t.f += i.f;
    })
  );
  return t;
}

export function weekSessions(db: Db): Session[] {
  const monday = addDays(new Date(), -((new Date().getDay() + 6) % 7));
  const mondayIso = iso(monday);
  return db.history.filter((s) => s.date >= mondayIso);
}

export function volumeOf(session: Session): number {
  return session.entries.reduce((a, e) => a + e.sets.reduce((b, s) => b + (s.w || 0) * (s.r || 0), 0), 0);
}

export function weeklyVolumes(db: Db): { week: number; v: number }[] {
  const out: Record<number, number> = {};
  db.history.forEach((s) => {
    out[s.week] = (out[s.week] || 0) + volumeOf(s);
  });
  return Object.keys(out)
    .map((k) => ({ week: +k, v: out[+k] }))
    .sort((a, b) => a.week - b.week);
}

export interface PersonalRecord {
  e1rm: number;
  w: number;
  r: number;
  date: string;
}

export function prFor(db: Db, exId: number): PersonalRecord | null {
  let best: PersonalRecord | null = null;
  db.history.forEach((s) =>
    s.entries
      .filter((e) => e.exId === exId)
      .forEach((e) =>
        e.sets.forEach((st) => {
          const v = e1rm(st.w || 0, st.r || 0);
          if (!best || v > best.e1rm) best = { e1rm: v, w: st.w, r: st.r, date: s.date };
        })
      )
  );
  return best;
}

export interface Adherence {
  workout: number;
  kcalAdh: number;
  proAdh: number;
  waterAdh: number;
  score: number;
  sessions: number;
  planned: number;
}

/** Weekly score out of 100: workouts x40, calories x25, protein x25, water x10. */
export function adherence(db: Db): Adherence {
  const ws = weekSessions(db);
  const planned = db.program.days.length;
  const workout = clamp(ws.length / planned, 0, 1);
  const t = targetsOf(db);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => iso(addDays(new Date(), -i)));
  const logged = days.map((d) => dayTotals(db, d)).filter((x) => x.cal > 0);
  const kcalAdh = logged.length
    ? logged.reduce((a, x) => a + clamp(1 - Math.abs(x.cal - t.kcal) / t.kcal, 0, 1), 0) / logged.length
    : 0;
  const proAdh = logged.length
    ? logged.reduce((a, x) => a + clamp(x.p / t.protein, 0, 1), 0) / logged.length
    : 0;
  const w = (db.water || {})[today()] || 0;
  const waterAdh = clamp(w / 100, 0, 1);
  const score = Math.round(workout * 40 + kcalAdh * 25 + proAdh * 25 + waterAdh * 10);
  return { workout, kcalAdh, proAdh, waterAdh, score, sessions: ws.length, planned };
}

export function exerciseName(exId: number): string {
  return EXERCISES[exId]?.name ?? "Unknown";
}

export { phaseFor };
