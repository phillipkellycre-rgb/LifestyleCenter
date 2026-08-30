import { DAYS, EXERCISES } from "@/lib/data";
import { adherence, prFor, scheduledDayIndexFor, volumeOf, weeklyVolumes } from "@/lib/domain/selectors";
import { addDays, clamp, iso } from "@/lib/domain/util";
import type { Db, MeasurementSite } from "@/lib/domain/types";

export interface WeekBarVM {
  d: string;
  h: string;
  bg: string;
}

export interface WeightStatVM {
  l: string;
  v: string;
}

export interface MeasureRowVM {
  site: MeasurementSite;
  current: string;
  delta: string;
}

export interface PrRowVM {
  name: string;
  set: string;
  e1rm: string;
}

export interface CardioRowVM {
  label: string;
  detail: string;
}

export interface BpRowVM {
  label: string;
  category: string;
  categoryColor: string;
  detail: string;
}

export interface RecoveryFieldVM {
  key: "sleep" | "energy" | "soreness" | "stress";
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface CalendarCellVM {
  n: number | "";
  bg: string;
  fg: string;
  border: string;
  title: string;
}

export interface ProgressVM {
  weekBars: WeekBarVM[];
  adherenceLine: string;
  weightRaw: string;
  weightTrend: string;
  goalLine: string;
  weightDelta: string;
  weightStats: WeightStatVM[];
  measures: MeasureRowVM[];
  prRows: PrRowVM[];
  cardioRows: CardioRowVM[];
  bpRows: BpRowVM[];
  bpLatestNote: string;
  recovery: RecoveryFieldVM[];
  recoveryAdvice: string;
  calendarLabel: string;
  calendar: CalendarCellVM[];
}

export function progressView(db: Db, today: string, monthOffset = 0): ProgressVM {
  const a = adherence(db);
  const vols = weeklyVolumes(db);
  const maxVol = Math.max(1, ...vols.map((x) => x.v));
  const weekStart = addDays(new Date(), -((new Date().getDay() + 6) % 7));

  const weekBars: WeekBarVM[] = DAYS.map((d, i) => {
    const date = iso(addDays(weekStart, i));
    const sessions = db.history.filter((x) => x.date === date);
    const vol = sessions.reduce((x, y) => x + volumeOf(y), 0);
    return {
      d: d[0],
      h: sessions.length ? `${clamp(vol / Math.max(1, maxVol / 4), 0.25, 1) * 100}%` : "14%",
      bg: sessions.length ? "var(--navy-3)" : "var(--hairline)",
    };
  });
  const adherenceLine = `Workouts ${a.sessions}/${a.planned} · calories ${Math.round(a.kcalAdh * 100)}% · protein ${Math.round(a.proAdh * 100)}% · score ${a.score}`;

  const ws = db.weights;
  const wmin = Math.min(...ws.map((x) => x.lb), db.profile.targetWeight) - 1;
  const wmax = Math.max(...ws.map((x) => x.lb)) + 1;
  const yFor = (lb: number) => (58 - ((lb - wmin) / Math.max(1, wmax - wmin)) * 52).toFixed(1);
  const weightRaw = ws.map((p, i) => `${((i / Math.max(1, ws.length - 1)) * 300).toFixed(0)},${yFor(p.lb)}`).join(" ");
  const trend = ws.map((p, i) => {
    const win = ws.slice(Math.max(0, i - 3), i + 1);
    return win.reduce((x, y) => x + y.lb, 0) / win.length;
  });
  const weightTrend = trend
    .map((lb, i) => `${((i / Math.max(1, trend.length - 1)) * 300).toFixed(0)},${yFor(lb)}`)
    .join(" ");
  const goalLine = `0,${yFor(ws[0].lb)} 300,${yFor(db.profile.targetWeight)}`;
  const change = ws[ws.length - 1].lb - ws[0].lb;
  const weeksSpan = Math.max(1, (ws.length * 2) / 7);
  const weightDelta = `${change.toFixed(1)} lb / ${Math.round(ws.length * 2 / 7)}wk`;
  const weightStats: WeightStatVM[] = [
    { l: "Start", v: `${ws[0].lb}` },
    { l: "Now", v: `${ws[ws.length - 1].lb}` },
    { l: "Goal", v: `${db.profile.targetWeight}` },
    { l: "Per wk", v: (change / weeksSpan).toFixed(2) },
  ];

  const measures: MeasureRowVM[] = (Object.keys(db.measures) as MeasurementSite[]).map((site) => {
    const [start, cur] = db.measures[site];
    const d = cur - start;
    return { site, current: `${cur} in`, delta: `${d >= 0 ? "+" : ""}${d.toFixed(1)}` };
  });

  const prLifts = EXERCISES.filter((e) => prFor(db, e.id)).slice(0, 40);
  const prRows: PrRowVM[] = prLifts
    .map((e) => ({ ex: e, pr: prFor(db, e.id)! }))
    .sort((x, y) => y.pr.e1rm - x.pr.e1rm)
    .slice(0, 6)
    .map((x) => ({ name: x.ex.name, set: `${x.pr.w} lb × ${x.pr.r}`, e1rm: `e1RM ${x.pr.e1rm} lb` }));

  const cardioRows: CardioRowVM[] = (db.cardio || []).slice(0, 5).map((c) => ({
    label: `${c.type} · ${c.min} min`,
    detail: `${c.dist ? `${c.dist} mi · ${(c.min / c.dist).toFixed(1)}/mi · ` : ""}${c.hr ? `${c.hr} bpm` : ""} · ${c.date.slice(5)}`,
  }));

  const bpRows: BpRowVM[] = (db.bloodPressure || []).slice(0, 8).map((r) => {
    const [category, categoryColor] = bpCategory(r.systolic, r.diastolic);
    return {
      label: `${r.systolic}/${r.diastolic}`,
      category,
      categoryColor,
      detail: `${r.pulse ? `${r.pulse} bpm · ` : ""}${r.date.slice(5)}`,
    };
  });
  const bpLatestNote = bpRows.length
    ? `Latest reading: ${bpRows[0].label} — ${bpRows[0].category}.`
    : "Log a reading to start tracking your trend.";

  const rec = (db.recovery || {})[today] || { sleep: 7, energy: 7, soreness: 4, stress: 4 };
  const recovery: RecoveryFieldVM[] = [
    { key: "sleep", label: "Sleep (h)", min: 3, max: 11, step: 0.5, value: rec.sleep },
    { key: "energy", label: "Energy", min: 1, max: 10, step: 1, value: rec.energy },
    { key: "soreness", label: "Soreness", min: 1, max: 10, step: 1, value: rec.soreness },
    { key: "stress", label: "Stress", min: 1, max: 10, step: 1, value: rec.stress },
  ];
  const recScore = Math.round(
    (rec.sleep / 8) * 30 + (rec.energy / 10) * 30 + ((11 - rec.soreness) / 10) * 25 + ((11 - rec.stress) / 10) * 15
  );
  const recoveryAdvice =
    recScore >= 75
      ? `Recovery score ${recScore} — green light. Take the programmed jump today.`
      : recScore >= 55
      ? `Recovery score ${recScore} — hold load, cut the last set of accessories if RPE climbs.`
      : `Recovery score ${recScore} — below your baseline. Drop to 85% and treat today as technique work.`;

  const base = new Date();
  base.setMonth(base.getMonth() + monthOffset, 1);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const pad = (first.getDay() + 6) % 7;
  const dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const calendarLabel = `${first.toLocaleString("en-US", { month: "long" })} ${first.getFullYear()}`;
  const calendar: CalendarCellVM[] = Array.from({ length: pad + dim }, (_, i) => {
    if (i < pad) return { n: "", bg: "transparent", fg: "transparent", border: "transparent", title: "" };
    const dnum = i - pad + 1;
    const date = iso(new Date(base.getFullYear(), base.getMonth(), dnum));
    const sessions = db.history.filter((x) => x.date === date);
    const isPast = date < today;
    const isScheduled = scheduledDayIndexFor(db, date) !== null;

    if (sessions.length) {
      return {
        n: dnum,
        bg: "var(--navy-3)",
        fg: "#fff",
        border: "var(--navy-3)",
        title: `${sessions.map((x) => x.name).join(", ")} · ${Math.round(volumeOf(sessions[0]))} lb`,
      };
    }
    if (isScheduled && !isPast) {
      return { n: dnum, bg: "transparent", fg: "var(--dim)", border: "var(--gold)", title: "Planned" };
    }
    if (isScheduled && isPast) {
      return { n: dnum, bg: "transparent", fg: "var(--error)", border: "var(--error)", title: "Missed" };
    }
    return {
      n: dnum,
      bg: "transparent",
      fg: "var(--dim)",
      border: "var(--hairline)",
      title: date < db.program.startDate ? "Before program start" : "Rest",
    };
  });

  return {
    weekBars,
    adherenceLine,
    weightRaw,
    weightTrend,
    goalLine,
    weightDelta,
    weightStats,
    measures,
    prRows,
    cardioRows,
    bpRows,
    bpLatestNote,
    recovery,
    recoveryAdvice,
    calendarLabel,
    calendar,
  };
}

export const CARDIO_TYPES = ["Running", "Walking", "Cycling", "Swimming", "Rowing", "Stairmaster", "Elliptical"];

/**
 * Informal category labels only (AHA-style thresholds) — not medical
 * advice. Higher of the two readings' category wins, matching how these
 * charts are conventionally read.
 */
function bpCategory(systolic: number, diastolic: number): [string, string] {
  if (systolic >= 180 || diastolic >= 120) return ["Crisis — seek care", "var(--error)"];
  if (systolic >= 140 || diastolic >= 90) return ["High (Stage 2)", "var(--error)"];
  if (systolic >= 130 || diastolic >= 80) return ["High (Stage 1)", "var(--gold-dim)"];
  if (systolic >= 120) return ["Elevated", "var(--gold-dim)"];
  return ["Normal", "var(--navy-3)"];
}
