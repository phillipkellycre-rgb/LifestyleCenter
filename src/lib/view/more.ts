import { computeTargets } from "@/lib/domain/calc";
import { phaseFor } from "@/lib/domain/program";
import { adherence, currentWeek, weeklyVolumes } from "@/lib/domain/selectors";
import type { Db } from "@/lib/domain/types";

export interface InsightVM {
  kicker: string;
  text: string;
}

export function insightsView(db: Db): InsightVM[] {
  const t = computeTargets(db.profile);
  const a = adherence(db);
  const week = currentWeek(db);
  const vols = weeklyVolumes(db);
  const ws = db.weights;
  const change = ws.length > 1 ? ws[ws.length - 1].lb - ws[0].lb : 0;
  const weeksSpan = Math.max(1, (ws.length * 2) / 7);
  const volChange = vols.length > 1 ? ((vols[vols.length - 1].v / vols[0].v) - 1) * 100 : 0;
  const nextWeek = week + 1;
  const nextPhase = phaseFor(nextWeek);

  return [
    { kicker: "Adherence", text: `You completed ${a.sessions} of ${a.planned} planned workouts this week.` },
    { kicker: "Protein", text: `Average protein intake is ${Math.round(a.proAdh * 100)}% of your ${t.protein}g target.` },
    {
      kicker: "Volume",
      text:
        vols.length > 1
          ? `Training volume has moved ${volChange.toFixed(1)}% since week ${vols[0].week}.`
          : "Log two weeks to see a volume trend.",
    },
    {
      kicker: "Bodyweight",
      text:
        ws.length > 1
          ? `Bodyweight is ${change.toFixed(1)} lb since ${ws[0].date.slice(5)}, ${(change / weeksSpan).toFixed(2)} lb per week.`
          : "Log your weight a few times to see a trend.",
    },
    {
      kicker: "Next week",
      text:
        nextPhase === "Deload"
          ? `Week ${nextWeek} is a scheduled deload — 85% loads, one set fewer.`
          : `Week ${nextWeek} is ${nextPhase.toLowerCase()}: compounds go up one increment where the rep range was cleared.`,
    },
  ];
}

export const COACH_PROMPTS = [
  "What should I eat tonight?",
  "Should I increase my calories?",
  "Why am I not losing weight?",
  "What workout should I do today?",
  "Can I substitute squats?",
  "How is my progress?",
];
