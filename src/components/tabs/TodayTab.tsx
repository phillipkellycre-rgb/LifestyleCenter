"use client";

import { useStore } from "@/lib/store/useStore";
import { todayView, WATER_STEPS } from "@/lib/view/today";
import { SUPPLEMENT_FREQUENCIES } from "@/lib/view/supplements";

export default function TodayTab() {
  const db = useStore((s) => s.db);
  const toggleExerciseDone = useStore((s) => s.toggleExerciseDone);
  const startWorkout = useStore((s) => s.startWorkout);
  const logFood = useStore((s) => s.logFood);
  const setTab = useStore((s) => s.setTab);
  const addWater = useStore((s) => s.addWater);
  const setPlanView = useStore((s) => s.setPlanView);
  const openGroceryPicker = useStore((s) => s.openGroceryPicker);
  const supplementDraft = useStore((s) => s.supplementDraft);
  const setSupplementDraftField = useStore((s) => s.setSupplementDraftField);
  const addSupplement = useStore((s) => s.addSupplement);
  const removeSupplement = useStore((s) => s.removeSupplement);
  const cycleSupplementTaken = useStore((s) => s.cycleSupplementTaken);

  const v = todayView(db);

  function goToGroceryList() {
    setPlanView("grocery");
    setTab("fuel");
  }

  return (
    <>
      {/* Spans the full grid width on desktop/iPad — as a 4th card sharing a
          row with the (much taller) Training Manifest, its short height was
          leaving a large empty gap in that row. */}
      <section className="px-[22px] pt-5 md:col-span-2 xl:col-span-3">
        <div
          className="rounded-[14px] p-4"
          style={
            v.isShoppingDay
              ? { background: "var(--note-bg)", border: "1px solid var(--note-border)" }
              : { background: "var(--card-bg)", border: "1px solid var(--hairline)" }
          }
        >
          {v.isShoppingDay && (
            <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-gold-dim mb-1.5">
              Sunday reminder — time to shop for the week
            </div>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-serif font-semibold text-[16px]">Grocery List</div>
              <div className="font-mono text-[10.5px] text-dim mt-0.5 truncate">
                {v.groceryCount > 0
                  ? `${v.groceryCount} item${v.groceryCount === 1 ? "" : "s"}${
                      v.groceryPreview.length
                        ? " — " + v.groceryPreview.join(", ") + (v.groceryCount > v.groceryPreview.length ? "…" : "")
                        : ""
                    }`
                  : "Nothing on your list yet — add items for your next trip"}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={openGroceryPicker}
                className="py-2.5 px-3.5 rounded-[10px] bg-navy text-gold border-0 font-mono text-[10.5px] tracking-[0.06em] uppercase cursor-pointer"
              >
                + Add items
              </button>
              <button
                onClick={goToGroceryList}
                className="py-2.5 px-3.5 rounded-[10px] border border-hairline bg-transparent font-mono text-[10.5px] tracking-[0.06em] uppercase text-gold-dim cursor-pointer"
              >
                View list →
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-[22px] pt-[22px]">
        <div className="flex items-baseline justify-between">
          <span className="font-serif font-semibold text-[18px]">Training Manifest</span>
          <span className="font-mono text-[10px]" style={{ color: v.restDay ? "var(--gold-dim)" : "var(--dim)" }}>
            {v.workoutTag}
          </span>
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
          disabled={v.startDisabled}
          className="w-full mt-4 py-3.5 rounded-xl bg-navy text-gold border-0 font-mono text-[12px] tracking-[0.1em] uppercase font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Water + Coach's Note share one section so the desktop grid places
          them together in a single narrow column instead of Note wrapping
          alone to a new row. */}
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

        <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-gold-dim mt-[22px]">
          Coach&apos;s Note
        </div>
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

      <section className="px-[22px] pt-[22px] pb-[26px]">
        <div className="flex items-baseline justify-between">
          <span className="font-serif font-semibold text-[18px]">Supplements</span>
          <span className="font-mono text-[10px] text-dim">
            {v.supplements.filter((s) => s.done).length}/{v.supplements.length} TODAY
          </span>
        </div>
        <div className="h-px bg-hairline my-2.5 mb-3" />
        {v.supplements.length === 0 && (
          <div className="py-2 font-mono text-[11px] text-dim italic">No supplements added yet.</div>
        )}
        {v.supplements.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-[11px] border-b border-dashed border-hairline">
            <button
              onClick={() => cycleSupplementTaken(s.id)}
              aria-label={`Mark ${s.name} taken`}
              className="w-[34px] h-[34px] min-w-[34px] rounded-full border-2 bg-transparent font-mono text-[13px] cursor-pointer flex items-center justify-center shrink-0"
              style={{
                borderColor: s.done ? "var(--gold)" : "var(--hairline)",
                color: s.taken > 0 ? "var(--gold-dim)" : "transparent",
              }}
            >
              {s.taken > 0 ? (s.target > 1 ? s.taken : "✓") : ""}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px]" style={{ color: s.done ? "var(--dim)" : "var(--ink)" }}>
                {s.name}
              </div>
              <div className="font-mono text-[10.5px] text-dim mt-0.5">
                {s.amount} · {s.frequency}
                {s.target > 1 ? ` · ${s.taken}/${s.target} today` : ""}
              </div>
            </div>
            <button
              onClick={() => removeSupplement(s.id)}
              aria-label={`Remove ${s.name}`}
              className="w-[26px] h-[26px] shrink-0 border-0 bg-transparent text-dim cursor-pointer text-[13px]"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="flex gap-2 mt-3.5">
          <input
            className="lb-input flex-[2]"
            value={supplementDraft.name}
            onChange={(e) => setSupplementDraftField("name", e.target.value)}
            placeholder="Name…"
            aria-label="New supplement name"
          />
          <input
            className="lb-input flex-1"
            value={supplementDraft.amount}
            onChange={(e) => setSupplementDraftField("amount", e.target.value)}
            placeholder="Amount (e.g. 2000 IU)"
            aria-label="New supplement amount"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <select
            className="lb-input flex-1"
            value={supplementDraft.frequency}
            onChange={(e) => setSupplementDraftField("frequency", e.target.value)}
            aria-label="New supplement frequency"
          >
            {SUPPLEMENT_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            onClick={addSupplement}
            className="shrink-0 px-4 bg-navy text-gold border-0 rounded-[10px] font-mono text-[11px] uppercase cursor-pointer"
          >
            Add
          </button>
        </div>
      </section>
    </>
  );
}
