import { RECIPES } from "@/lib/data";
import { fmt } from "./util";
import { adherence, currentWeek, dayTotals, phaseFor, targetsOf, today, todayPlan, weeklyVolumes } from "./selectors";
import type { Db } from "./types";

/**
 * Keyword-routed coach: every branch cites real numbers pulled from the
 * user's own state (targets, adherence, weight trend, today's plan). The
 * fallback summarizes week/phase/score. Ported near-verbatim from the
 * prototype's askCoach so the routing and copy stay identical.
 */
export function askCoach(db: Db, q: string): string {
  const t = targetsOf(db);
  const a = adherence(db);
  const ql = q.toLowerCase();
  const tot = dayTotals(db, today());
  const weights = db.weights;
  const wChange = weights.length > 1 ? weights[weights.length - 1].lb - weights[0].lb : 0;
  const week = currentWeek(db);
  const phase = phaseFor(week);

  if (/eat|dinner|food|meal/.test(ql)) {
    const left = t.kcal - tot.cal;
    const pLeft = t.protein - tot.p;
    const pick = RECIPES.filter((r) => r.slot === "D").sort(
      (x, y) => Math.abs(x.cal - left) - Math.abs(y.cal - left)
    )[0];
    return (
      "You have " +
      fmt(Math.max(0, left)) +
      " kcal and " +
      Math.max(0, Math.round(pLeft)) +
      "g protein left today.\n" +
      pick.name +
      " fits: " +
      pick.cal +
      " kcal, " +
      pick.p +
      "g protein, " +
      pick.time +
      " min."
    );
  }
  if (/calorie|surplus|deficit|increase my cal/.test(ql)) {
    const rate = wChange / (weights.length ? Math.max(1, weights.length / 3.5) : 1);
    return (
      "You are averaging " +
      rate.toFixed(2) +
      " lb/week and eating a " +
      fmt(t.tdee - t.kcal) +
      " kcal deficit against a " +
      fmt(t.tdee) +
      " kcal TDEE.\n" +
      (Math.abs(rate) < 0.2
        ? "Trend has stalled — drop 150 kcal or add two cardio sessions."
        : "Hold the current target; the trend is inside plan.")
    );
  }
  if (/not losing|plateau|stall/.test(ql)) {
    return (
      "Total change is " +
      wChange.toFixed(1) +
      " lb over " +
      weights.length * 2 +
      " days. Calorie adherence is " +
      Math.round(a.kcalAdh * 100) +
      "% and protein " +
      Math.round(a.proAdh * 100) +
      "%.\n" +
      (a.kcalAdh < 0.85
        ? "Adherence is the limiter, not metabolism — tighten the weekday logs first."
        : "Adherence is solid. Cut 150 kcal or add 2,000 steps daily for two weeks.")
    );
  }
  if (/workout should i|today/.test(ql)) {
    const p = todayPlan(db);
    return "Today is " + p.name + " — " + p.exercises.length + " exercises, week " + week + " (" + phase + ").";
  }
  if (/substitut|swap|squat/.test(ql)) {
    return "Open any exercise in workout mode and tap SWAP — replacements keep the same muscle group and equipment, and your progression history carries over to the new lift.";
  }
  if (/progress|how am i|how is my/.test(ql)) {
    const v = weeklyVolumes(db);
    const vd = v.length > 1 ? ((v[v.length - 1].v - v[0].v) / Math.max(1, v[0].v)) * 100 : 0;
    return (
      "You completed " +
      a.sessions +
      " of " +
      a.planned +
      " sessions this week. Volume is " +
      (vd >= 0 ? "+" : "") +
      vd.toFixed(1) +
      "% since week 1, bodyweight " +
      wChange.toFixed(1) +
      " lb, weekly score " +
      a.score +
      "."
    );
  }
  return (
    "Week " +
    week +
    ", " +
    phase +
    " phase. Score " +
    a.score +
    "/100 — workouts " +
    a.sessions +
    "/" +
    a.planned +
    ", calories " +
    Math.round(a.kcalAdh * 100) +
    "%, protein " +
    Math.round(a.proAdh * 100) +
    "%. Ask about food, calories, progress or substitutions."
  );
}
