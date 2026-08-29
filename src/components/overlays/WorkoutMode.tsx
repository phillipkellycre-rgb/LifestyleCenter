"use client";

import type { ReactNode } from "react";
import { EXERCISES } from "@/lib/data";
import { lastPerf } from "@/lib/domain/progression";
import { prFor } from "@/lib/domain/selectors";
import { useStore } from "@/lib/store/useStore";

const REST_PRESETS: [number, string][] = [
  [60, "60s"],
  [90, "90s"],
  [180, "3 MIN"],
];

export default function WorkoutMode() {
  const db = useStore((s) => s.db);
  const session = useStore((s) => s.session);
  const rest = useStore((s) => s.rest);
  const setRest = useStore((s) => s.setRest);
  const updateSessionRow = useStore((s) => s.updateSessionRow);
  const toggleSessionRow = useStore((s) => s.toggleSessionRow);
  const addSet = useStore((s) => s.addSet);
  const dropSet = useStore((s) => s.dropSet);
  const openSwapExercise = useStore((s) => s.openSwapExercise);
  const prevExercise = useStore((s) => s.prevExercise);
  const nextExercise = useStore((s) => s.nextExercise);
  const quitSession = useStore((s) => s.quitSession);

  if (!session) return null;

  const cur = session.exercises[session.i];
  const ex = EXERCISES[cur.exId];
  const last = lastPerf(db.history, cur.exId);
  const pr = prFor(db, cur.exId);
  const lastStr = last
    ? `${Math.max(...last.entry.sets.map((s) => s.w))} × ${last.entry.sets.map((s) => s.r).join("/")}`
    : "first time";
  const isLast = session.i === session.exercises.length - 1;
  const restClock = `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`;

  return (
    <div className="lb-scroll absolute inset-0 bg-paper z-[90] overflow-y-auto">
      <div
        className="relative px-[22px] pt-[18px] pb-5"
        style={{ background: "linear-gradient(180deg, var(--navy) 0%, var(--navy-2) 100%)" }}
      >
        <div className="flex justify-between items-center">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold">
            WORKOUT MODE · {session.name.toUpperCase()}
          </div>
          <button onClick={quitSession} className="bg-transparent border-0 font-mono text-[10px] tracking-[0.1em] text-[#9FB3CC] cursor-pointer">
            EXIT
          </button>
        </div>
        <div className="font-serif font-semibold text-[27px] leading-[1.05] text-white mt-2">{ex.name}</div>
        <div className="font-mono text-[10.5px] text-[#9FB3CC] mt-1.5">
          {ex.group} · {ex.equip} · exercise {session.i + 1} of {session.exercises.length}
        </div>
        <div className="flex gap-1.5 mt-3.5">
          {session.exercises.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-sm"
              style={{
                background: i < session.i ? "var(--navy-3)" : i === session.i ? "var(--gold)" : "rgba(14,42,76,0.14)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="px-[22px] pt-[18px]">
        <div className="flex gap-2.5">
          <Stat label="Last time" value={lastStr} />
          <Stat label="Today" value={cur.target} accent />
          <Stat label="Est. 1RM" value={pr ? `${pr.e1rm} lb` : "—"} />
        </div>
        <div
          className="rounded-[4px] p-3.5 mt-3.5"
          style={{ background: "var(--note-bg)", border: "1px solid var(--note-border)" }}
        >
          <div className="font-serif italic text-[13.5px] leading-[1.5]" style={{ color: "var(--note-ink)" }}>
            {cur.why}
          </div>
        </div>

        <div
          className="grid gap-2 mt-[18px] font-mono text-[8.5px] tracking-[0.1em] uppercase text-dim"
          style={{ gridTemplateColumns: "26px 1fr 1fr 1fr 34px" }}
        >
          <div>Set</div>
          <div>Lb</div>
          <div>Reps</div>
          <div>RPE</div>
          <div />
        </div>
        {cur.rows.map((r, ri) => (
          <div
            key={ri}
            className="grid gap-2 items-center py-[7px] border-b border-dashed border-hairline"
            style={{ gridTemplateColumns: "26px 1fr 1fr 1fr 34px", opacity: r.done ? 0.55 : 1 }}
          >
            <div className="font-mono text-[13px] font-bold">{ri + 1}</div>
            <input
              className="lb-input text-center"
              type="number"
              value={r.w}
              onChange={(e) => updateSessionRow(ri, "w", e.target.value)}
              aria-label="Weight"
              style={{ padding: "8px 6px" }}
            />
            <input
              className="lb-input text-center"
              type="number"
              value={r.r}
              onChange={(e) => updateSessionRow(ri, "r", e.target.value)}
              aria-label="Reps"
              style={{ padding: "8px 6px" }}
            />
            <input
              className="lb-input text-center"
              type="number"
              step="0.5"
              value={r.rpe}
              onChange={(e) => updateSessionRow(ri, "rpe", e.target.value)}
              aria-label="RPE"
              style={{ padding: "8px 6px" }}
            />
            <button
              onClick={() => toggleSessionRow(ri)}
              aria-label="Complete set"
              className="w-[34px] h-[34px] rounded-full border-2 bg-transparent font-mono text-[13px] cursor-pointer"
              style={{
                borderColor: r.done ? "var(--gold)" : "var(--hairline)",
                color: r.done ? "var(--gold-dim)" : "transparent",
                transform: r.done ? "rotate(-8deg)" : "rotate(0deg)",
              }}
            >
              {r.done ? "✓" : ""}
            </button>
          </div>
        ))}

        <div className="flex gap-2 mt-2.5">
          <OutlineButton onClick={addSet}>+ SET</OutlineButton>
          <OutlineButton onClick={dropSet}>− SET</OutlineButton>
          <OutlineButton onClick={openSwapExercise} accent>
            SWAP
          </OutlineButton>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <div className="font-mono text-[34px] font-bold tracking-[-0.02em]">{restClock}</div>
          <div className="flex gap-1.5 flex-1">
            {REST_PRESETS.map(([n, label]) => (
              <button
                key={n}
                onClick={() => setRest(n)}
                className="flex-1 py-2.5 border border-hairline bg-card-bg rounded-[10px] font-mono text-[10px] text-navy-3 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 my-[18px] mb-[30px]">
          <button
            onClick={prevExercise}
            className="py-[13px] px-3.5 border border-hairline bg-card-bg rounded-xl font-mono text-[11px] text-navy-3 cursor-pointer"
          >
            PREV
          </button>
          <button
            onClick={nextExercise}
            className="flex-1 py-[13px] bg-navy text-gold border-0 rounded-xl font-mono text-[11px] tracking-[0.1em] uppercase font-bold cursor-pointer"
          >
            {isLast ? "Finish workout" : "Next exercise"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex-1">
      <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-dim">{label}</div>
      <div className="font-mono text-[14px] font-bold" style={{ color: accent ? "var(--navy-3)" : "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function OutlineButton({
  children,
  onClick,
  accent,
}: {
  children: ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 border border-hairline bg-card-bg rounded-[10px] font-mono text-[10px] cursor-pointer"
      style={{ color: accent ? "var(--gold-dim)" : "var(--navy-3)" }}
    >
      {children}
    </button>
  );
}
