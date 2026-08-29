import { EXERCISES } from "@/lib/data";
import { round5 } from "./util";
import type { Phase, ProgramExercise, ProgressionResult, Session } from "./types";

/**
 * Finds the most recent logged performance of an exercise. History is assumed
 * chronological, so we scan from the end.
 */
export function lastPerf(
  history: Session[],
  exId: number
): { session: Session; entry: Session["entries"][number] } | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i].entries.find((x) => x.exId === exId);
    if (entry && entry.sets.length) return { session: history[i], entry };
  }
  return null;
}

/**
 * Double-progression scheme: no history starts conservative; clearing the
 * rep range at low RPE earns a load jump; missing the rep floor or grinding
 * at high RPE triggers an 8% back-off; otherwise hold load and chase one
 * more rep. Deload weeks apply a flat 85% cut and drop one set.
 */
export function progression(
  planEx: ProgramExercise,
  weekPhase: Phase,
  history: Session[]
): ProgressionResult {
  const ex = EXERCISES[planEx.exId];
  const last = lastPerf(history, planEx.exId);
  const inc = ex.inc || (ex.equip === "Bodyweight" ? 0 : 5);
  let weight = planEx.weight;
  let reps = planEx.repLow;
  let sets = planEx.sets;
  let why: string;

  if (!last) {
    why = "First session on this lift. Start conservative and leave two reps in the tank.";
  } else {
    const ls = last.entry.sets;
    const topReps = Math.max(...ls.map((s) => s.r || 0));
    const minReps = Math.min(...ls.map((s) => s.r || 0));
    const avgRpe = ls.reduce((a, s) => a + (s.rpe || 8), 0) / ls.length;
    const lastW = Math.max(...ls.map((s) => s.w || 0));
    if (minReps >= planEx.repHigh && avgRpe <= 8.5) {
      weight = lastW + inc;
      reps = planEx.repLow;
      why =
        "You hit the top of the rep range on every set at RPE " +
        avgRpe.toFixed(1) +
        ". Weight goes up " +
        inc +
        " lb and reps reset to " +
        planEx.repLow +
        ".";
    } else if (avgRpe >= 9.3 || minReps < planEx.repLow) {
      weight = Math.max(inc, round5(lastW * 0.92));
      reps = planEx.repLow;
      why =
        "Last session ran at RPE " +
        avgRpe.toFixed(1) +
        " and dropped below the rep floor. We back off 8% to rebuild the range.";
    } else {
      weight = lastW;
      reps = Math.min(planEx.repHigh, topReps + 1);
      why = "Same load, one more rep. Get " + planEx.repHigh + " on all sets to unlock +" + inc + " lb.";
    }
  }

  if (weekPhase === "Deload") {
    weight = round5(weight * 0.85);
    sets = Math.max(2, sets - 1);
    why = "Deload week — load drops to 85% and one set comes off so fatigue clears.";
  }

  return { weight, reps, sets, why, last, inc };
}
