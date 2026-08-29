"use client";

import { useStore } from "@/lib/store/useStore";
import { todayView, WATER_STEPS } from "@/lib/view/today";

export default function TodayTab() {
  const db = useStore((s) => s.db);
  const toggleExerciseDone = useStore((s) => s.toggleExerciseDone);
  const startWorkout = useStore((s) => s.startWorkout);
  const logFood = useStore((s) => s.logFood);
  const setTab = useStore((s) => s.setTab);
  const addWater = useStore((s) => s.addWater);

  const v = todayView(db);

  return (
    <>
      <section className="px-[22px] pt-5">
        <div className="flex items-baseline justify-between">
          <span className="font-serif font-semibold text-[18px]">Training Manifest</span>
          <span className="font-mono text-[10px] text-dim">{v.workoutTag}</span>
        </div>
        <div className="h-px bg-hairline my-2.5 mb-3" />
        {v.exercises.map((e) => (
          <div key={e.exId} className="flex items-center gap-3 py-[11px] border-b border-dashed border-hairline">
            <button
              onClick={() => toggleExerciseDone(e.exId)}
              aria-label={`Mark ${e.name} done`}
              className="w-[34px] h-[34px] min-w-[34px] rounded-full border-2 bg-transparent font-mono text-[14px] cursor-pointer flex items-center justify-center"
              style={{
                borderColor: e.done ? "var(--gold)" : "var(--hairline)",
                color: e.done ? "var(--gold-dim)" : "transparent",
                transform: e.done ? "rotate(-8deg)" : "rotate(0deg)",
              }}
            >
              {e.done ? "✓" : ""}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px]" style={{ color: e.done ? "var(--dim)" : "var(--ink)" }}>
                {e.name}
              </div>
              <div className="font-mono text-[10.5px] text-dim mt-0.5">{e.meta}</div>
              <div className="h-1 bg-hairline rounded-sm mt-1.5 overflow-hidden">
                <div className="h-full rounded-sm bg-navy-3" style={{ width: `${e.pct * 100}%` }} />
              </div>
            </div>
            <div className="text-right font-mono shrink-0">
              <div className="text-[14px] font-bold">{e.load}</div>
              <div className="text-[8.5px] tracking-[0.08em] text-dim">{e.loadUnit}</div>
            </div>
          </div>
        ))}
        <button
          onClick={startWorkout}
          className="w-full mt-4 py-3.5 rounded-xl bg-navy text-gold border-0 font-mono text-[12px] tracking-[0.1em] uppercase font-bold cursor-pointer"
        >
          {v.startLabel}
        </button>
      </section>

      <section className="px-[22px] pt-[22px]">
        <div className="flex items-baseline justify-between">
          <span className="font-serif font-semibold text-[18px]">Provisions Log</span>
          <span className="font-mono text-[10px] text-dim">{v.fuelTag}</span>
        </div>
        <div className="h-px bg-hairline mt-2.5 mb-1.5" />
        {v.meals.map((m) => (
          <div key={m.slot} className="py-3 border-b border-dashed border-hairline" style={{ opacity: m.opacity }}>
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-dim">{m.slotLabel}</div>
                <div className="font-serif font-semibold text-[15.5px] mt-0.5 truncate">{m.name}</div>
              </div>
              <div className="font-mono text-[15px] font-bold text-navy-3 shrink-0">
                {m.kcal}
                <span className="text-[8.5px] text-dim font-normal"> kcal</span>
              </div>
            </div>
            <div className="flex gap-3.5 mt-2 font-mono text-[10.5px] text-dim">
              <span>
                P <b className="text-ink">{m.p}</b>
              </span>
              <span>
                C <b className="text-ink">{m.c}</b>
              </span>
              <span>
                F <b className="text-ink">{m.f}</b>
              </span>
              <button
                onClick={() =>
                  m.logged ? setTab("fuel") : m.logCandidate && logFood(m.slot, m.logCandidate, 1)
                }
                className="ml-auto bg-transparent border-0 font-mono text-[10.5px] text-gold-dim cursor-pointer tracking-[0.06em]"
              >
                {m.logged ? "OPEN LOG" : "LOG THIS"}
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="px-[22px] pt-[22px]">
        <div className="flex items-baseline justify-between">
          <span className="font-serif font-semibold text-[18px]">Water</span>
          <span className="font-mono text-[10px] text-dim">{v.waterLine}</span>
        </div>
        <div className="h-px bg-hairline my-2.5 mb-3" />
        <div className="h-2 bg-hairline rounded-sm overflow-hidden">
          <div className="h-full bg-navy-3" style={{ width: `${v.waterPct * 100}%` }} />
        </div>
        <div className="flex gap-2 mt-3">
          {WATER_STEPS.map((oz) => (
            <button
              key={oz}
              onClick={() => addWater(oz)}
              className="flex-1 py-2.5 rounded-[10px] border border-hairline bg-card-bg font-mono text-[11px] text-navy-3 cursor-pointer"
            >
              +{oz} OZ
            </button>
          ))}
        </div>
      </section>

      <section className="px-[22px] pt-[22px] pb-[26px]">
        <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-gold-dim">Coach&apos;s Note</div>
        <div
          className="relative mt-1.5 rounded-[4px] p-4"
          style={{ background: "var(--note-bg)", border: "1px solid var(--note-border)" }}
        >
          <div className="absolute left-3.5 top-0 bottom-0 w-px" style={{ background: "var(--note-rule)" }} />
          <div
            className="font-serif italic text-[14px] leading-[1.5] pl-1.5"
            style={{ color: "var(--note-ink)" }}
          >
            {v.coachNote}
          </div>
        </div>
      </section>
    </>
  );
}
