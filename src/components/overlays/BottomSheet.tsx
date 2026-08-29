"use client";

import { SLOTS } from "@/lib/data";
import { useStore } from "@/lib/store/useStore";

export default function BottomSheet() {
  const sheet = useStore((s) => s.sheet);
  const closeSheet = useStore((s) => s.closeSheet);
  const sheetQty = useStore((s) => s.sheetQty);
  const sheetSlot = useStore((s) => s.sheetSlot);
  const setSheetSlot = useStore((s) => s.setSheetSlot);
  const qtyUp = useStore((s) => s.qtyUp);
  const qtyDown = useStore((s) => s.qtyDown);
  const confirmLog = useStore((s) => s.confirmLog);
  const recipeLog = useStore((s) => s.recipeLog);
  const recipeToGrocery = useStore((s) => s.recipeToGrocery);
  const feedback = useStore((s) => s.feedback);
  const setFeedbackField = useStore((s) => s.setFeedbackField);
  const submitFeedback = useStore((s) => s.submitFeedback);
  const session = useStore((s) => s.session);

  if (!sheet) return null;

  const doneSets = session
    ? session.exercises.reduce((x, e) => x + e.rows.filter((r) => r.done).length, 0)
    : 0;

  return (
    <>
      <div onClick={closeSheet} className="absolute inset-0 z-[95]" style={{ background: "var(--scrim)" }} />
      <div
        className="lb-scroll absolute left-0 right-0 bottom-0 overflow-y-auto bg-paper z-[100] px-[22px] pt-4 pb-[26px]"
        style={{ maxHeight: "82%", borderRadius: "22px 22px 0 0", boxShadow: "0 -20px 40px rgba(0,0,0,0.3)" }}
      >
        <div className="w-9 h-1 bg-hairline rounded-sm mx-auto mb-3.5" />

        {sheet.kind === "food" && (
          <>
            <div className="font-serif font-semibold text-[20px]">{sheet.food.name}</div>
            <div className="font-mono text-[10.5px] text-dim mt-1">
              {sheet.food.cal} kcal · P {sheet.food.p}g · C {sheet.food.c}g · F {sheet.food.f}g {sheet.food.base}
            </div>
            <div className="flex items-center justify-between mt-4.5">
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-dim">Servings</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={qtyDown}
                  aria-label="Fewer servings"
                  className="w-[34px] h-[34px] rounded-[9px] border border-hairline bg-card-bg text-navy-3 text-[17px] font-semibold cursor-pointer"
                >
                  −
                </button>
                <div className="font-mono text-[16px] font-bold min-w-[62px] text-center">{sheetQty.toFixed(1)}×</div>
                <button
                  onClick={qtyUp}
                  aria-label="More servings"
                  className="w-[34px] h-[34px] rounded-[9px] border border-hairline bg-card-bg text-navy-3 text-[17px] font-semibold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSheetSlot(s)}
                  className="flex-1 py-2.5 rounded-[10px] border font-mono text-[10px] tracking-[0.06em] uppercase cursor-pointer"
                  style={{
                    background: sheetSlot === s ? "var(--navy)" : "#fff",
                    color: sheetSlot === s ? "var(--gold)" : "var(--dim)",
                    borderColor: sheetSlot === s ? "var(--navy)" : "var(--hairline)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-3.5 mt-4 pt-3.5 border-t border-dashed border-hairline font-mono text-[10.5px] text-dim">
              <div>
                KCAL <b className="text-ink text-[13px]">{Math.round(sheet.food.cal * sheetQty)}</b>
              </div>
              <div>
                P <b className="text-ink text-[13px]">{Math.round(sheet.food.p * sheetQty)}g</b>
              </div>
              <div>
                C <b className="text-ink text-[13px]">{Math.round(sheet.food.c * sheetQty)}g</b>
              </div>
              <div>
                F <b className="text-ink text-[13px]">{Math.round(sheet.food.f * sheetQty)}g</b>
              </div>
            </div>
            <button
              onClick={confirmLog}
              className="w-full mt-4.5 py-3.5 bg-navy text-gold border-0 rounded-xl font-mono text-[12px] tracking-[0.1em] uppercase font-bold cursor-pointer"
            >
              Log entry
            </button>
          </>
        )}

        {sheet.kind === "recipe" && (
          <>
            <div className="font-serif font-semibold text-[20px]">{sheet.recipe.name}</div>
            <div className="font-mono text-[10.5px] text-dim mt-1">
              {sheet.slot} · {sheet.recipe.time} min · serves 1
            </div>
            <div className="flex gap-3.5 mt-3.5 font-mono text-[10.5px] text-dim">
              <div>
                KCAL <b className="text-ink text-[13px]">{sheet.recipe.cal}</b>
              </div>
              <div>
                P <b className="text-ink text-[13px]">{sheet.recipe.p}g</b>
              </div>
              <div>
                C <b className="text-ink text-[13px]">{sheet.recipe.c}g</b>
              </div>
              <div>
                F <b className="text-ink text-[13px]">{sheet.recipe.f}g</b>
              </div>
              <div>
                FIB <b className="text-ink text-[13px]">{sheet.recipe.fiber}g</b>
              </div>
            </div>
            <div className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-gold-dim mt-4.5">Ingredients</div>
            {sheet.recipe.ingredients.map((i, idx) => (
              <div key={idx} className="flex justify-between py-[7px] border-b border-dashed border-hairline text-[13px]">
                <span>{i.name}</span>
                <span className="font-mono text-[10.5px] text-dim">{i.qty}</span>
              </div>
            ))}
            <div className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-gold-dim mt-4.5">Method</div>
            {sheet.recipe.steps.map((s, idx) => (
              <div key={idx} className="text-[13.5px] mt-2 leading-[1.5]">
                {s}
              </div>
            ))}
            <div className="flex gap-2 mt-4.5">
              <button
                onClick={recipeLog}
                className="flex-1 py-[13px] bg-navy text-gold border-0 rounded-xl font-mono text-[11px] tracking-[0.08em] uppercase font-bold cursor-pointer"
              >
                Log meal
              </button>
              <button
                onClick={recipeToGrocery}
                className="flex-1 py-[13px] border border-hairline bg-card-bg rounded-xl font-mono text-[11px] tracking-[0.08em] uppercase text-gold-dim cursor-pointer"
              >
                To grocery
              </button>
            </div>
          </>
        )}

        {sheet.kind === "options" && (
          <>
            <div className="font-serif font-semibold text-[20px]">{sheet.title}</div>
            <div className="font-mono text-[10.5px] text-dim mt-1">{sheet.subtitle}</div>
            {sheet.options.map((o, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2.5 py-2.5 border-b border-dashed border-hairline">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">{o.name}</div>
                  <div className="font-mono text-[10px] text-dim mt-0.5">{o.detail}</div>
                </div>
                <button
                  onClick={o.pick}
                  className="py-2.5 px-3 rounded-[10px] border border-hairline bg-card-bg font-mono text-[10px] text-navy-3 cursor-pointer shrink-0"
                >
                  USE
                </button>
              </div>
            ))}
          </>
        )}

        {sheet.kind === "feedback" && (
          <>
            <div className="font-serif font-semibold text-[20px]">How did that workout feel?</div>
            <div className="font-mono text-[10.5px] text-dim mt-1">
              {session ? `${session.name} · ${doneSets} sets logged` : ""}
            </div>
            {(
              [
                ["energy", "Energy"],
                ["difficulty", "Difficulty"],
                ["soreness", "Soreness"],
                ["overall", "Overall"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="mt-3.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-dim">{label}</span>
                  <b>{feedback[key]}</b>
                </div>
                <input
                  className="lb-range"
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={feedback[key]}
                  onChange={(e) => setFeedbackField(key, Number(e.target.value))}
                  aria-label={label}
                />
              </div>
            ))}
            <button
              onClick={submitFeedback}
              className="w-full mt-4.5 py-3.5 bg-navy text-gold border-0 rounded-xl font-mono text-[12px] tracking-[0.1em] uppercase font-bold cursor-pointer"
            >
              Save session
            </button>
          </>
        )}
      </div>
    </>
  );
}
