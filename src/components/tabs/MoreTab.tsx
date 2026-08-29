"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { computeTargets } from "@/lib/domain/calc";
import { fmt } from "@/lib/domain/util";
import { useStore } from "@/lib/store/useStore";
import { COACH_PROMPTS, insightsView } from "@/lib/view/more";
import type { ActivityLevel, Goal, Sex } from "@/lib/domain/types";

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
  const edit = useStore((s) => s.edit);
  const rebuildProgram = useStore((s) => s.rebuildProgram);
  const resetAll = useStore((s) => s.resetAll);

  const t = computeTargets(db.profile);
  const insights = insightsView(db);
  const goals = db.profile.goals || [];
  const engineLine = `Mifflin-St Jeor BMR × ${db.profile.activity.toLowerCase()} activity, ${
    goals.includes("Fat loss") ? "500 kcal deficit" : goals.includes("Muscle gain") ? "300 kcal surplus" : "maintenance"
  }. Fiber target ${t.fiber}g. Everything you log is synced to your account.`;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <section className="px-[22px] pt-5 pb-[26px]">
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

      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim mt-[26px]">Profile &amp; targets</div>
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
        <Field label="Days / week">
          <select
            className="lb-input"
            value={db.profile.daysPerWeek}
            onChange={(e) =>
              edit((d) => {
                d.profile.daysPerWeek = Number(e.target.value) as 3 | 4 | 5;
              })
            }
          >
            {[3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
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
            onChange={(e) => setProfileField("proteinOverride", e.target.value ? parseFloat(e.target.value) : null)}
          />
        </Field>
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
