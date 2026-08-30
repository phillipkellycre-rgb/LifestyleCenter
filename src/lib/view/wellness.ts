import { DAYS } from "@/lib/data";
import { addDays, clamp, iso, linearTrend } from "@/lib/domain/util";
import type { Db, WellnessEntry } from "@/lib/domain/types";

export interface WellnessWeekBarVM {
  d: string;
  h: string;
  bg: string;
}

export interface WellnessSeriesPointVM {
  label: string;
  moodLine: string;
  stressLine: string;
  anxietyLine: string;
}

export interface WellnessStatVM {
  l: string;
  v: string;
}

export interface WellnessHistoryRowVM {
  date: string;
  label: string;
  mood: number;
  stress: number;
  anxiety: number;
  note: string;
  score: number;
}

export interface WellnessOutlookVM {
  available: boolean;
  message: string;
  label: string;
  color: string;
  projected: number;
}

export interface WellnessTodayVM {
  mood: number;
  stress: number;
  anxiety: number;
  note: string;
}

export interface WellnessVM {
  hasEntries: boolean;
  today: WellnessTodayVM;
  weekBars: WellnessWeekBarVM[];
  weekLine: string;
  chart: WellnessSeriesPointVM;
  stats: WellnessStatVM[];
  outlook: WellnessOutlookVM;
  history: WellnessHistoryRowVM[];
}

/** Composite 0–100 score: mood weighted most, stress/anxiety inverted. */
export function wellnessScore(e: { mood: number; stress: number; anxiety: number }): number {
  return Math.round((e.mood / 10) * 50 + ((11 - e.stress) / 10) * 25 + ((11 - e.anxiety) / 10) * 25);
}

const CHART_W = 300;
const CHART_TOP = 6;
const CHART_BOTTOM = 58;

function lineFor(values: number[]): string {
  const yFor = (v: number) => (CHART_BOTTOM - ((v - 1) / 9) * (CHART_BOTTOM - CHART_TOP)).toFixed(1);
  return values.map((v, i) => `${((i / Math.max(1, values.length - 1)) * CHART_W).toFixed(0)},${yFor(v)}`).join(" ");
}

export function wellnessView(db: Db, todayStr: string): WellnessVM {
  const entries = [...(db.wellness || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  const hasEntries = entries.length > 0;

  const weekStart = addDays(new Date(), -((new Date().getDay() + 6) % 7));
  const byDate: Record<string, WellnessEntry> = {};
  entries.forEach((e) => {
    byDate[e.date] = e;
  });
  const todayEntry = byDate[todayStr];
  const today: WellnessTodayVM = todayEntry
    ? { mood: todayEntry.mood, stress: todayEntry.stress, anxiety: todayEntry.anxiety, note: todayEntry.note }
    : { mood: 5, stress: 5, anxiety: 5, note: "" };
  const weekBars: WellnessWeekBarVM[] = DAYS.map((d, i) => {
    const date = iso(addDays(weekStart, i));
    const e = byDate[date];
    return {
      d: d[0],
      h: e ? `${clamp(wellnessScore(e), 12, 100)}%` : "12%",
      bg: e ? "var(--navy-3)" : "var(--hairline)",
    };
  });
  const weekEntries = DAYS.map((_, i) => byDate[iso(addDays(weekStart, i))]).filter(Boolean) as WellnessEntry[];
  const weekAvgScore = weekEntries.length
    ? Math.round(weekEntries.reduce((a, e) => a + wellnessScore(e), 0) / weekEntries.length)
    : 0;
  const weekLine = weekEntries.length
    ? `Checked in ${weekEntries.length}/7 days · avg mood ${(
        weekEntries.reduce((a, e) => a + e.mood, 0) / weekEntries.length
      ).toFixed(1)} · week score ${weekAvgScore}`
    : "No check-ins logged yet this week.";

  const recent = entries.slice(-30);
  const chart: WellnessSeriesPointVM = {
    label: recent.length ? `${recent[0].date.slice(5)} – ${recent[recent.length - 1].date.slice(5)}` : "",
    moodLine: lineFor(recent.map((e) => e.mood)),
    stressLine: lineFor(recent.map((e) => e.stress)),
    anxietyLine: lineFor(recent.map((e) => e.anxiety)),
  };

  const stats: WellnessStatVM[] = hasEntries
    ? [
        { l: "Entries", v: `${entries.length}` },
        { l: "Avg mood", v: (entries.reduce((a, e) => a + e.mood, 0) / entries.length).toFixed(1) },
        { l: "Avg stress", v: (entries.reduce((a, e) => a + e.stress, 0) / entries.length).toFixed(1) },
        { l: "This week", v: `${weekAvgScore}` },
      ]
    : [];

  let outlook: WellnessOutlookVM = {
    available: false,
    message: "Log at least 3 check-ins to see a trend outlook.",
    label: "",
    color: "var(--dim)",
    projected: 0,
  };
  if (entries.length >= 3) {
    const scores = entries.slice(-14).map((e) => wellnessScore(e));
    const trend = linearTrend(scores);
    const projected = Math.round(clamp(trend.project(7), 0, 100));
    const last = scores[scores.length - 1];
    const diff = projected - last;
    const label = diff > 3 ? "Trending up" : diff < -3 ? "Trending down" : "Holding steady";
    const color = diff > 3 ? "var(--navy-3)" : diff < -3 ? "var(--error)" : "var(--dim)";
    outlook = {
      available: true,
      message: `Based on your last ${scores.length} check-ins — a personal trend line, not a clinical prediction.`,
      label: `${label} · projected ${projected}/100 next week`,
      color,
      projected,
    };
  }

  const history: WellnessHistoryRowVM[] = [...entries]
    .reverse()
    .slice(0, 14)
    .map((e) => ({
      date: e.date,
      label: e.date === todayStr ? "Today" : e.date.slice(5),
      mood: e.mood,
      stress: e.stress,
      anxiety: e.anxiety,
      note: e.note,
      score: wellnessScore(e),
    }));

  return { hasEntries, today, weekBars, weekLine, chart, stats, outlook, history };
}
