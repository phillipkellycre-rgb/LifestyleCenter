import { computeTargets } from "@/lib/domain/calc";
import { phaseFor } from "@/lib/domain/program";
import { adherence, currentWeek, dayTotals, today, todayPlan, weeklyVolumes } from "@/lib/domain/selectors";
import { clamp, fmt } from "@/lib/domain/util";
import { DAYS } from "@/lib/data";
import type { Db } from "@/lib/domain/types";
import type { MastheadProps } from "@/components/Masthead";
import type { TabId } from "@/lib/store/uiTypes";

const CIRCUMFERENCE = 182.2;
const ringOf = (c: number) => clamp(c, 0, 1);

function macroBars(tot: { p: number; c: number; f: number }, t: ReturnType<typeof computeTargets>) {
  return [
    { l: "PROTEIN", v: `${Math.round(tot.p)} / ${t.protein}g`, pct: ringOf(tot.p / t.protein), color: "var(--macro-protein)" },
    { l: "CARBS", v: `${Math.round(tot.c)} / ${t.carbs}g`, pct: ringOf(tot.c / t.carbs), color: "var(--macro-carbs)" },
    { l: "FAT", v: `${Math.round(tot.f)} / ${t.fat}g`, pct: ringOf(tot.f / t.fat), color: "var(--macro-fat)" },
  ];
}

export function mastheadFor(tab: TabId, db: Db): MastheadProps {
  const t = computeTargets(db.profile);
  const dateStr = today();
  const tot = dayTotals(db, dateStr);
  const a = adherence(db);
  const week = currentWeek(db);
  const phase = phaseFor(week);
  const water = (db.water || {})[dateStr] || 0;
  const dayNo = Math.round((Date.now() - new Date(db.program.startDate).getTime()) / 864e5);
  const plan = todayPlan(db);
  const doneToday = db.history.filter((s) => s.date === dateStr);

  if (tab === "fuel") {
    return {
      eyebrow: `Entry No. ${dayNo} · ${DAYS[(new Date().getDay() + 6) % 7]}`,
      title: "Provisions",
      sub: `${fmt(tot.cal)} of ${fmt(t.kcal)} kcal taken`,
      ringVal: `${Math.round((tot.cal / t.kcal) * 100)}%`,
      ringLabel: "TAKEN",
      ringPct: ringOf(tot.cal / t.kcal),
      stats: [
        { v: fmt(t.kcal - tot.cal), l: "Kcal Left" },
        { v: `${Math.round(t.protein - tot.p)}g`, l: "Protein Left" },
        { v: `${water} oz`, l: "Water" },
      ],
      macros: macroBars(tot, t),
    };
  }
  if (tab === "train") {
    const vols = weeklyVolumes(db);
    return {
      eyebrow: `Week ${week} of 12 · ${phase}`,
      title: db.program.title.replace("12-Week ", ""),
      sub: `${db.program.days.length} sessions per week · ${db.history.length} logged`,
      ringVal: `${week}/12`,
      ringLabel: "BLOCK",
      ringPct: ringOf(week / 12),
      stats: [
        { v: fmt(vols.length ? vols[vols.length - 1].v : 0), l: "Volume Lb" },
        { v: `${a.sessions}/${a.planned}`, l: "This Week" },
        { v: phase, l: "Phase" },
      ],
    };
  }
  if (tab === "progress") {
    const w0 = db.weights[0];
    const w1 = db.weights[db.weights.length - 1];
    return {
      eyebrow: "Six-Week Chart",
      title: "Progress",
      sub: `${w1.lb} lb · goal ${db.profile.targetWeight} lb`,
      ringVal: `${Math.round(ringOf((w0.lb - w1.lb) / Math.max(1, w0.lb - db.profile.targetWeight)) * 100)}%`,
      ringLabel: "TO GOAL",
      ringPct: ringOf((w0.lb - w1.lb) / Math.max(1, w0.lb - db.profile.targetWeight)),
      stats: [
        { v: (w1.lb - w0.lb).toFixed(1), l: "Lb Change" },
        { v: `${a.sessions}/${a.planned}`, l: "Sessions" },
        { v: `${a.score}`, l: "Week Score" },
      ],
    };
  }
  if (tab === "more") {
    return {
      eyebrow: "Coach & Profile",
      title: "The Desk",
      sub: "Every answer computed from your logs",
      ringVal: `${a.score}`,
      ringLabel: "SCORE",
      ringPct: ringOf(a.score / 100),
      stats: [
        { v: fmt(t.tdee), l: "TDEE" },
        { v: fmt(t.kcal), l: "Target" },
        { v: `${t.protein}g`, l: "Protein" },
      ],
    };
  }
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning, " : hour < 18 ? "Good afternoon, " : "Good evening, ";
  return {
    eyebrow: `Entry No. ${dayNo} · Day ${dayNo} of Program`,
    title: greeting + db.profile.name,
    sub: `${plan.name} · ${fmt(t.kcal)} kcal voyage`,
    ringVal: `${a.score}%`,
    ringLabel: "SCORE",
    ringPct: ringOf(a.score / 100),
    stats: [
      { v: fmt(tot.cal), l: "Kcal Taken" },
      {
        v: `${doneToday.length ? doneToday[0].entries.length : db.completedToday.length}/${plan.exercises.length}`,
        l: "Lifts Done",
      },
      { v: `${Math.round(tot.p)}g`, l: "Protein" },
    ],
    macros: macroBars(tot, t),
  };
}

export { CIRCUMFERENCE };
