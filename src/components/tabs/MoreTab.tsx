"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DOW_SHORT } from "@/lib/data";
import { computeTargets } from "@/lib/domain/calc";
import { phaseFor } from "@/lib/domain/program";
import { currentWeek, isBeforeStart, today } from "@/lib/domain/selectors";
import { fmt, formatIsoDate } from "@/lib/domain/util";
import { useStore } from "@/lib/store/useStore";
import { COACH_PROMPTS, insightsView } from "@/lib/view/more";
import {
  disableSupplementReminders,
  enableSupplementReminders,
  isSupplementReminderEnabled,
  notificationPermission,
  type ReminderPermission,
} from "@/lib/notify";
import type { ActivityLevel, Goal, Phase, Sex } from "@/lib/domain/types";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun, as JS Date.getDay() values

const PHASE_ROWS: { phase: Phase; weeks: string; blurb: string }[] = [
  { phase: "Foundation", weeks: "Weeks 1–3", blurb: "Groove the rep ranges at a manageable effort before pushing load." },
  { phase: "Overload", weeks: "Weeks 5–7", blurb: "Same double-progression engine — you're further into the block." },
  { phase: "Intensify", weeks: "Weeks 9–11", blurb: "Same engine again — the label just marks where you are in the 12." },
  { phase: "Deload", weeks: "Every 4th week", blurb: "Load cuts to 85% and one set drops so fatigue actually clears." },
];

const PROGRESSION_RULES = [
  {
    kicker: "No history yet",
    text: "Start at the seeded weight, bottom of the rep range — leave two reps in the tank.",
  },
  {
    kicker: "Cleared the top of the range",
    text: "Every set hit the rep ceiling at RPE ≤ 8.5 → weight goes up by the lift's increment, reps reset to the floor.",
  },
  {
    kicker: "Missed the floor or ground it out",
    text: "A set fell below the rep floor, or average RPE ≥ 9.3 → weight backs off 8%, reps reset to the floor.",
  },
  {
    kicker: "Anywhere in between",
    text: "Weight holds. Target is one more rep than your best set last time — climb the rep range before the next load jump.",
  },
];

const SEX_OPTIONS: Sex[] = ["Male", "Female"];
const ACTIVITY_OPTIONS: ActivityLevel[] = ["Sedentary", "Light", "Moderate", "High", "Athlete"];
const GOAL_OPTIONS: Goal[] = [
  "Fat loss",
  "Muscle gain",
  "Strength",
  "General fitness",
  "Endurance",
  "Recomposition",
  "Maintenance",
];

export default function MoreTab() {
  const router = useRouter();
  const db = useStore((s) => s.db);
  const chatDraft = useStore((s) => s.chatDraft);
  const setChatDraft = useStore((s) => s.setChatDraft);
  const sendChat = useStore((s) => s.sendChat);
  const askCoachPrompt = useStore((s) => s.askCoachPrompt);
  const setProfileField = useStore((s) => s.setProfileField);
  const toggleGoal = useStore((s) => s.toggleGoal);
  const toggleWorkoutDay = useStore((s) => s.toggleWorkoutDay);
  const setProgramStartDate = useStore((s) => s.setProgramStartDate);
  const rebuildProgram = useStore((s) => s.rebuildProgram);
  const resetAll = useStore((s) => s.resetAll);

  // MoreTab only ever mounts client-side (Shell withholds the whole tab tree
  // until the store has hydrated), so reading these browser-only APIs as the
  // initial state is safe — there is no server-rendered version to mismatch.
  const [reminderEnabled, setReminderEnabled] = useState(() => isSupplementReminderEnabled());
  const [notifStatus, setNotifStatus] = useState<ReminderPermission>(() => notificationPermission());
  const remindersOn = reminderEnabled && notifStatus === "granted";

  async function handleToggleReminders() {
    if (remindersOn) {
      disableSupplementReminders();
      setReminderEnabled(false);
      return;
    }
    const granted = await enableSupplementReminders();
    setReminderEnabled(granted);
    setNotifStatus(notificationPermission());
  }

  const t = computeTargets(db.profile);
  const insights = insightsView(db);
  const goals = db.profile.goals || [];
  const workoutDays = db.profile.workoutDays || [];
  const week = currentWeek(db);
  const phase = phaseFor(week);
  const dateStr = today();
  const beforeStart = isBeforeStart(db, dateStr);
  const engineLine = `Mifflin-St Jeor BMR × ${db.profile.activity.toLowerCase()} activity, ${
    goals.includes("Fat loss") ? "500 kcal deficit" : goals.includes("Muscle gain") ? "300 kcal surplus" : "maintenance"
  }. Fiber target ${t.fiber}g. Everything you log is synced to your account.`;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* Spans the full grid width on desktop/iPad — pairing this
          (shorter, chat-driven) card with the much taller "How your
          program works" card left a large empty gap beneath it. */}
      <section className="px-[22px] pt-5 pb-[26px] md:col-span-2 xl:col-span-3">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Coach</div>
        {insights.map((i, idx) => (
          <div key={idx} className="py-[11px] border-b border-dashed border-hairline">
            <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-gold-dim">{i.kicker}</div>
            <div className="text-[14px] mt-[3px]">{i.text}</div>
          </div>
        ))}

        <div className="flex gap-1.5 overflow-x-auto mt-3.5 pb-1 lb-scroll">
          {COACH_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => askCoachPrompt(p)}
              className="shrink-0 py-2 px-3 rounded-full border border-hairline bg-card-bg font-mono text-[10px] text-navy-3 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2.5">
          <input
            className="lb-input flex-1"
            style={{ fontFamily: "var(--font-inter)" }}
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendChat();
            }}
            placeholder="Ask the coach…"
            aria-label="Ask the coach"
          />
          <button
            onClick={sendChat}
            className="px-4 bg-navy text-gold border-0 rounded-[10px] font-mono text-[11px] uppercase cursor-pointer"
          >
            Ask
          </button>
        </div>
        {(db.chat || []).slice(0, 12).map((c, i) => (
          <div key={i} className="py-[11px] border-b border-dashed border-hairline">
            <div
              className="font-mono text-[9px] tracking-[0.12em] uppercase"
              style={{ color: c.who === "Coach" ? "var(--gold-dim)" : "var(--dim)" }}
            >
              {c.who}
            </div>
            <div className="text-[14px] mt-[3px]" style={{ whiteSpace: "pre-line" }}>
              {c.text}
            </div>
          </div>
        ))}
      </section>

      <section className="px-[22px] pt-[22px] pb-[26px]">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">How your program works</div>
        <div className="text-[13.5px] mt-2 leading-[1.5]">
          {db.program.title} · Week {week} of 12 · currently <b>{phase}</b>
        </div>

        <div className="mt-3">
          {PHASE_ROWS.map((row) => {
            const active = row.phase === phase;
            return (
              <div
                key={row.phase}
                className="flex gap-3 py-[10px] border-b border-dashed border-hairline"
                style={{ opacity: active ? 1 : 0.65 }}
              >
                <div className="w-[92px] shrink-0">
                  <div
                    className="font-mono text-[9px] tracking-[0.1em] uppercase"
                    style={{ color: active ? "var(--gold-dim)" : "var(--dim)" }}
                  >
                    {row.phase}
                  </div>
                  <div className="font-mono text-[9.5px] text-dim mt-0.5">{row.weeks}</div>
                </div>
                <div className="text-[12.5px] flex-1">{row.blurb}</div>
              </div>
            );
          })}
        </div>
        <div className="font-mono text-[9px] text-dim mt-1.5">
          Deload lands on every 4th week regardless of block, so it always overrides Foundation/Overload/Intensify.
        </div>

        <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-dim mt-4">Per-lift progression</div>
        <div className="text-[11.5px] text-dim mt-1 leading-[1.5]">
          Every lift is judged on its own last logged session — not a fixed script:
        </div>
        {PROGRESSION_RULES.map((r, i) => (
          <div key={i} className="py-[9px] border-b border-dashed border-hairline">
            <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-gold-dim">{r.kicker}</div>
            <div className="text-[13px] mt-[3px]">{r.text}</div>
          </div>
        ))}
        <div className="font-mono text-[9px] text-dim mt-1.5 leading-[1.5]">
          On a Deload week, whatever that logic lands on gets cut to 85% weight with one set dropped, on top of the
          rule above.
        </div>
      </section>

      <section className="px-[22px] pt-[22px] pb-[26px]">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Profile &amp; targets</div>
        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
          <Field label="Name">
            <input
              className="lb-input"
              value={db.profile.name}
              onChange={(e) => setProfileField("name", e.target.value)}
            />
          </Field>
          <Field label="Age">
            <input
              className="lb-input"
              type="number"
              value={db.profile.age}
              onChange={(e) => setProfileField("age", parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label="Sex">
            <select
              className="lb-input"
              value={db.profile.sex}
              onChange={(e) => setProfileField("sex", e.target.value)}
            >
              {SEX_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Height (in)">
            <input
              className="lb-input"
              type="number"
              value={db.profile.heightIn}
              onChange={(e) => setProfileField("heightIn", parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label="Weight (lb)">
            <input
              className="lb-input"
              type="number"
              value={db.profile.weight}
              onChange={(e) => setProfileField("weight", parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label="Goal weight">
            <input
              className="lb-input"
              type="number"
              value={db.profile.targetWeight}
              onChange={(e) => setProfileField("targetWeight", parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label="Activity">
            <select
              className="lb-input"
              value={db.profile.activity}
              onChange={(e) => setProfileField("activity", e.target.value)}
            >
              {ACTIVITY_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kcal override">
            <input
              className="lb-input"
              type="number"
              value={db.profile.kcalOverride ?? ""}
              onChange={(e) => setProfileField("kcalOverride", e.target.value ? parseFloat(e.target.value) : null)}
            />
          </Field>
          <Field label="Protein override">
            <input
              className="lb-input"
              type="number"
              value={db.profile.proteinOverride ?? ""}
              onChange={(e) =>
                setProfileField("proteinOverride", e.target.value ? parseFloat(e.target.value) : null)
              }
            />
          </Field>
        </div>

        <label className="font-mono text-[9px] tracking-[0.1em] uppercase text-dim block mb-1 mt-3.5">
          Workout days
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {WEEK_ORDER.map((dow) => {
            const on = workoutDays.includes(dow);
            return (
              <button
                key={dow}
                onClick={() => toggleWorkoutDay(dow)}
                className="py-[7px] px-2.5 rounded-full border font-mono text-[10px] cursor-pointer"
                style={{
                  background: on ? "var(--navy)" : "#fff",
                  color: on ? "var(--gold)" : "var(--navy-3)",
                  borderColor: on ? "var(--navy)" : "var(--hairline)",
                }}
              >
                {DOW_SHORT[dow]}
              </button>
            );
          })}
        </div>
        <div className="font-mono text-[9px] text-dim mt-1.5">
          {workoutDays.length} days selected (3–5). Rebuild the program below to apply a change in count.
        </div>

        <Field label="Workout start date">
          <input
            className="lb-input"
            type="date"
            value={db.program.startDate}
            onChange={(e) => e.target.value && setProgramStartDate(e.target.value)}
          />
        </Field>
        <div className="font-mono text-[9px] text-dim mt-1.5">
          {beforeStart
            ? `Program begins ${formatIsoDate(db.program.startDate)} — Week 1 starts that day.`
            : `Week ${week} of 12, started ${formatIsoDate(db.program.startDate)}.`}
        </div>

        <div className="flex gap-1.5 flex-wrap mt-3.5">
          {GOAL_OPTIONS.map((g) => {
            const on = goals.includes(g);
            return (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className="py-[7px] px-2.5 rounded-full border font-mono text-[10px] cursor-pointer"
                style={{
                  background: on ? "var(--navy)" : "#fff",
                  color: on ? "var(--gold)" : "var(--navy-3)",
                  borderColor: on ? "var(--navy)" : "var(--hairline)",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {[
            { label: "BMR", value: fmt(t.bmr) },
            { label: "TDEE", value: fmt(t.tdee) },
            { label: "Calories", value: fmt(t.kcal) },
            { label: "Protein", value: `${t.protein}g` },
            { label: "Carbs", value: `${t.carbs}g` },
            { label: "Fat", value: `${t.fat}g` },
          ].map((row) => (
            <div key={row.label}>
              <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-dim">{row.label}</div>
              <div className="font-mono text-[15px] font-bold">{row.value}</div>
            </div>
          ))}
        </div>
        <div className="font-mono text-[10px] text-dim mt-2.5 leading-[1.6]">{engineLine}</div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-hairline">
          <div className="min-w-0">
            <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-dim">
              Evening Supplement Reminders
            </div>
            <div className="font-mono text-[10px] text-dim mt-1 leading-[1.5]">
              {notifStatus === "unsupported"
                ? "Not supported in this browser."
                : notifStatus === "denied"
                ? "Blocked — allow notifications for this site in your browser settings."
                : remindersOn
                ? "On — a notification fires after 6pm if any are still unlogged."
                : "Off — turn on to get a nudge after 6pm."}
            </div>
          </div>
          <button
            onClick={handleToggleReminders}
            disabled={notifStatus === "unsupported" || notifStatus === "denied"}
            className="shrink-0 px-4 py-2.5 rounded-[10px] border font-mono text-[10.5px] tracking-[0.06em] uppercase cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: remindersOn ? "var(--navy)" : "#fff",
              color: remindersOn ? "var(--gold)" : "var(--navy-3)",
              borderColor: remindersOn ? "var(--navy)" : "var(--hairline)",
            }}
          >
            {remindersOn ? "On" : "Off"}
          </button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={rebuildProgram}
            className="flex-1 py-2.5 border border-hairline bg-card-bg rounded-[10px] font-mono text-[10.5px] tracking-[0.06em] uppercase text-navy-3 cursor-pointer"
          >
            Rebuild program
          </button>
          <button
            onClick={resetAll}
            className="flex-1 py-2.5 border border-hairline bg-card-bg rounded-[10px] font-mono text-[10.5px] tracking-[0.06em] uppercase text-gold-dim cursor-pointer"
          >
            Reset all data
          </button>
        </div>
        <button
          onClick={logout}
          className="w-full mt-2.5 py-2.5 border border-hairline bg-card-bg rounded-[10px] font-mono text-[10.5px] tracking-[0.06em] uppercase text-dim cursor-pointer"
        >
          Log out
        </button>
      </section>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[9px] tracking-[0.1em] uppercase text-dim block mb-1">{label}</label>
      {children}
    </div>
  );
}
