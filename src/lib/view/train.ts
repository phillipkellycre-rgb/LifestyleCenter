import { DOW_NAMES, exByName } from "@/lib/data";
import { phaseFor } from "@/lib/domain/program";
import { currentWeek, exerciseName, prFor, weeklyVolumes } from "@/lib/domain/selectors";
import { clamp, fmt } from "@/lib/domain/util";
import type { Db } from "@/lib/domain/types";

export interface WeekChipVM {
  n: number;
  tag: string;
  bg: string;
  fg: string;
  border: string;
}

export interface DayExerciseVM {
  exIndex: number;
  exId: number;
  name: string;
}

export interface DayRowVM {
  dayIndex: number;
  name: string;
  dayLabel: string;
  state: string;
  stateColor: string;
  exercises: DayExerciseVM[];
  startLabel: string;
}

export interface LiftChartVM {
  name: string;
  delta: string;
  planned: string;
  actual: string;
  caption: string;
}

export interface VolumeBarVM {
  h: string;
  label: string;
  bg: string;
}

export interface TrainVM {
  programTitle: string;
  programTag: string;
  weeks: WeekChipVM[];
  prescription: string;
  days: DayRowVM[];
  liftCharts: LiftChartVM[];
  volumeBars: VolumeBarVM[];
  volumeCaption: string;
}

const PRESCRIPTIONS: Record<string, string> = {
  Deload: "Deload — 85% load, one set removed, RPE capped at 6.",
  Foundation: "Foundation — build the rep range at RPE 7, add reps before load.",
  Overload: "Overload — double progression; top of range on all sets earns the jump.",
  Intensify: "Intensification — heavier triples and fives, accessories held flat.",
};

const KEY_LIFTS = ["Barbell Bench Press", "Back Squat", "Barbell Row"];

export function trainView(db: Db): TrainVM {
  const week = currentWeek(db);
  const phase = phaseFor(week);
  const selWeek = db.selWeek || week;
  const selPhase = phaseFor(selWeek);

  const weeks: WeekChipVM[] = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const ph = phaseFor(n);
    const cur = n === selWeek;
    return {
      n,
      tag: ph === "Deload" ? "DL" : ph.slice(0, 4).toUpperCase(),
      bg: cur ? "var(--navy)" : n < week ? "rgba(31,74,125,0.10)" : "#fff",
      fg: cur ? "var(--gold)" : "var(--navy)",
      border: cur ? "var(--navy)" : "var(--hairline)",
    };
  });

  const sortedWorkoutDays = [...(db.profile.workoutDays || [])].sort((a, b) => a - b);
  const days: DayRowVM[] = db.program.days.map((d, di) => {
    const logged = db.history.filter((s) => s.week === selWeek && s.dayIndex === di);
    const dow = sortedWorkoutDays[di];
    return {
      dayIndex: di,
      name: d.name,
      dayLabel: dow !== undefined ? DOW_NAMES[dow] : "",
      state: logged.length ? "COMPLETED" : selWeek < week ? "MISSED" : selWeek === week ? "PLANNED" : "UPCOMING",
      stateColor: logged.length ? "var(--navy-3)" : selWeek < week ? "var(--error)" : "var(--dim)",
      exercises: d.exercises.map((pe, exIndex) => ({ exIndex, exId: pe.exId, name: exerciseName(pe.exId) })),
      startLabel: logged.length ? "REVIEW / REPEAT SESSION" : "START THIS SESSION",
    };
  });

  const liftCharts: LiftChartVM[] = KEY_LIFTS.filter((n) => exByName[n]).map((name) => {
    const ex = exByName[name];
    const byWeek: Record<number, number> = {};
    db.history.forEach((s) =>
      s.entries
        .filter((e) => e.exId === ex.id)
        .forEach((e) => {
          const top = Math.max(0, ...e.sets.map((x) => x.w || 0));
          byWeek[s.week] = Math.max(byWeek[s.week] || 0, top);
        })
    );
    const weekNums = Object.keys(byWeek)
      .map(Number)
      .sort((a, b) => a - b);
    if (!weekNums.length) {
      return { name, delta: "no data", planned: "", actual: "", caption: "Log this lift to build the chart." };
    }
    const vals = weekNums.map((w) => byWeek[w]);
    const min = Math.min(...vals) - 10;
    const max = Math.max(...vals) + 10;
    const pts = (arr: number[]) =>
      arr
        .map((val, i) => {
          const x = ((i / Math.max(1, arr.length - 1)) * 300).toFixed(0);
          const y = (55 - ((val - min) / Math.max(1, max - min)) * 50).toFixed(1);
          return `${x},${y}`;
        })
        .join(" ");
    const plannedVals = vals.map((_, i) => vals[0] + i * (ex.inc || 5));
    const delta = vals[vals.length - 1] - vals[0];
    const pr = prFor(db, ex.id);
    return {
      name,
      delta: `${delta >= 0 ? "+" : ""}${delta} lb / ${weekNums.length} wk`,
      planned: pts(plannedVals),
      actual: pts(vals),
      caption: `Actual ${vals[vals.length - 1]} lb vs programmed ${plannedVals[plannedVals.length - 1]} lb · e1RM ${pr ? pr.e1rm + " lb" : "—"}`,
    };
  });

  const vols = weeklyVolumes(db);
  const maxVol = Math.max(1, ...vols.map((x) => x.v));
  const volumeBars: VolumeBarVM[] = vols.map((x) => ({
    h: `${clamp(x.v / maxVol, 0.08, 1) * 100}%`,
    label: `W${x.week}`,
    bg: phaseFor(x.week) === "Deload" ? "var(--chart-ghost)" : "var(--navy-3)",
  }));
  const volumeCaption =
    vols.length > 1
      ? `Week ${vols[vols.length - 1].week} total ${fmt(vols[vols.length - 1].v)} lb, ${(((vols[vols.length - 1].v / vols[0].v) - 1) * 100).toFixed(1)}% against week ${vols[0].week}.`
      : "Volume builds once you log two weeks.";

  return {
    programTitle: db.program.title,
    programTag: `WK ${week} · ${phase.toUpperCase()}`,
    weeks,
    prescription: PRESCRIPTIONS[selPhase],
    days,
    liftCharts,
    volumeBars,
    volumeCaption,
  };
}
