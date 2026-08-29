"use client";

import { FOODS, RECIPES } from "@/lib/data";
import { today } from "@/lib/domain/selectors";
import { useStore } from "@/lib/store/useStore";
import { diaryView, groceryView, planView } from "@/lib/view/fuel";

export default function FuelTab() {
  const db = useStore((s) => s.db);
  const foodQuery = useStore((s) => s.foodQuery);
  const setFoodQuery = useStore((s) => s.setFoodQuery);
  const openFoodSheet = useStore((s) => s.openFoodSheet);
  const edit = useStore((s) => s.edit);
  const planViewMode = useStore((s) => s.planView);
  const setPlanView = useStore((s) => s.setPlanView);
  const openRecipeSheet = useStore((s) => s.openRecipeSheet);
  const openCustomFoodSheet = useStore((s) => s.openCustomFoodSheet);
  const openEditFoodEntry = useStore((s) => s.openEditFoodEntry);
  const swapMeal = useStore((s) => s.swapMeal);
  const toggleGrocery = useStore((s) => s.toggleGrocery);
  const setSheetSlot = useStore((s) => s.setSheetSlot);

  const dateStr = today();
  const fq = foodQuery.trim().toLowerCase();
  const allFoods = [...(db.customFoods || []), ...FOODS];
  const matches = fq ? allFoods.filter((f) => f.name.toLowerCase().includes(fq)) : [];
  const hint = fq
    ? matches.length
      ? `${matches.length} MATCHES`
      : "NO MATCHES — TRY ANOTHER SEARCH"
    : 'TRY "CHICKEN", "OATS", "GREEK YOGURT"…';

  const diary = diaryView(db, dateStr);
  const showPlan = planViewMode === "plan";
  const plan = showPlan ? planView(db) : [];
  const grocery = !showPlan ? groceryView(db) : [];

  return (
    <>
      <section className="px-[22px] pt-[18px]">
        <div className="flex items-center gap-2.5 bg-card-bg border border-hairline rounded-xl py-2.5 px-3.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="#6B7C93" strokeWidth={2} className="w-4 h-4 shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            placeholder="Log a provision — search foods…"
            aria-label="Search foods"
            className="border-0 outline-none flex-1 text-[14px] text-ink bg-transparent min-w-0"
          />
        </div>
        <div className="font-mono text-[9.5px] tracking-[0.08em] text-dim mt-2 mx-0.5">{hint}</div>
        {matches.slice(0, 8).map((f) => (
          <button
            key={f.id}
            onClick={() => openFoodSheet(f)}
            className="flex items-center gap-3 w-full text-left py-2.5 px-0.5 border-0 border-b border-dashed border-hairline bg-transparent cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[13.5px] text-ink">{f.name}</div>
              <div className="font-mono text-[10px] text-dim mt-px">
                {f.cal} kcal · P{f.p} C{f.c} F{f.f} · {f.base}
              </div>
            </div>
            <div className="w-[26px] h-[26px] rounded-full border-[1.5px] border-navy-3 text-navy-3 flex items-center justify-center text-[15px] font-bold shrink-0">
              +
            </div>
          </button>
        ))}
        {fq && (
          <button
            onClick={() => openCustomFoodSheet(foodQuery.trim())}
            className="w-full text-left py-2.5 px-0.5 border-0 bg-transparent cursor-pointer font-mono text-[11px] tracking-[0.04em] text-gold-dim"
          >
            + ADD &quot;{foodQuery.trim()}&quot; WITH REAL NUMBERS
          </button>
        )}
      </section>

      <section className="px-[22px] pt-[18px]">
        {diary.map((d) => (
          <div key={d.slot} className="mb-2">
            <div className="flex items-baseline justify-between">
              <span className="font-serif font-semibold text-[17px]">{d.slot}</span>
              <span className="font-mono text-[12px] font-bold text-navy-3">
                {d.kcal}
                <span className="text-dim font-normal text-[9.5px]"> {d.note}</span>
              </span>
            </div>
            <div className="h-px bg-hairline mt-2 mb-1" />
            {d.items.map((i) => (
              <div key={i.index} className="flex items-center gap-2.5 py-2.5 border-b border-dashed border-hairline">
                <button
                  onClick={() => openEditFoodEntry(d.slot, i.index)}
                  className="flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
                >
                  <div className="font-semibold text-[13.5px]">{i.name}</div>
                  <div className="font-mono text-[10px] text-dim mt-0.5">{i.macros}</div>
                </button>
                <button
                  onClick={() => openEditFoodEntry(d.slot, i.index)}
                  className="font-mono text-[13px] font-bold bg-transparent border-0 cursor-pointer"
                >
                  {i.kcal}
                </button>
                <button
                  onClick={() =>
                    edit((db2) => {
                      db2.foodLog[dateStr][d.slot].splice(i.index, 1);
                    })
                  }
                  aria-label="Remove entry"
                  className="w-[26px] h-[26px] border-0 bg-transparent text-dim cursor-pointer text-[13px]"
                >
                  ✕
                </button>
              </div>
            ))}
            {d.empty && (
              <div className="py-3 font-mono text-[11px] text-dim italic">{d.emptyText}</div>
            )}
            <button
              onClick={() => {
                setSheetSlot(d.slot);
                setFoodQuery("");
              }}
              className="bg-transparent border-0 pt-2.5 pb-0.5 font-mono text-[11px] tracking-[0.04em] text-gold-dim cursor-pointer"
            >
              + ADD TO {d.slot.toUpperCase()}
            </button>
          </div>
        ))}
      </section>

      <section className="px-[22px] pt-[18px] pb-[26px]">
        <div className="flex items-baseline justify-between">
          <span className="font-serif font-semibold text-[17px]">{showPlan ? "This Week's Plan" : "Grocery List"}</span>
          <button
            onClick={() => setPlanView(showPlan ? "grocery" : "plan")}
            className="bg-transparent border-0 font-mono text-[10.5px] text-gold-dim cursor-pointer"
          >
            {showPlan ? "GROCERY LIST →" : "← MEAL PLAN"}
          </button>
        </div>
        <div className="h-px bg-hairline mt-2 mb-1" />
        {showPlan &&
          plan.map((p) => (
            <div key={p.dayIndex} className="py-2.5 border-b border-dashed border-hairline">
              <div className="flex justify-between items-baseline">
                <div
                  className="font-mono text-[10px] tracking-[0.12em] uppercase"
                  style={{ color: p.isToday ? "var(--gold-dim)" : "var(--dim)" }}
                >
                  {p.day}
                </div>
                <div className="font-mono text-[10px] text-dim">{p.total}</div>
              </div>
              {p.meals.map((m) => (
                <div key={m.mealIndex} className="flex justify-between items-center gap-2.5 py-[7px]">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold">{m.name}</div>
                    <div className="font-mono text-[9.5px] text-dim">{m.meta}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        const meal = db.mealPlan[p.dayIndex].meals[m.mealIndex];
                        openRecipeSheet(RECIPES[meal.recipeId], meal.slot);
                      }}
                      className="border border-hairline bg-card-bg rounded-lg py-[5px] px-2 font-mono text-[9.5px] text-navy-3 cursor-pointer"
                    >
                      RECIPE
                    </button>
                    <button
                      onClick={() => swapMeal(p.dayIndex, m.mealIndex)}
                      className="border border-hairline bg-card-bg rounded-lg py-[5px] px-2 font-mono text-[9.5px] text-gold-dim cursor-pointer"
                    >
                      SWAP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        {!showPlan &&
          grocery.map((g) => (
            <div key={g.name} className="mt-3">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-gold-dim">{g.name}</div>
              {g.items.map((i) => (
                <button
                  key={i.key}
                  onClick={() => toggleGrocery(i.key)}
                  className="flex items-center gap-2.5 w-full text-left bg-transparent border-0 border-b border-dashed border-hairline py-2.5 cursor-pointer"
                  style={{ opacity: i.checked ? 0.45 : 1 }}
                >
                  <span
                    className="w-[18px] h-[18px] min-w-[18px] rounded-[5px] border-[1.5px] font-mono text-[11px] flex items-center justify-center text-gold-dim"
                    style={{ borderColor: i.checked ? "var(--gold)" : "rgba(14,42,76,0.2)" }}
                  >
                    {i.checked ? "✓" : ""}
                  </span>
                  <span
                    className="flex-1 text-[13.5px] text-ink"
                    style={{ textDecoration: i.checked ? "line-through" : "none" }}
                  >
                    {i.name}
                  </span>
                  <span className="font-mono text-[10px] text-dim">{i.qty}</span>
                </button>
              ))}
            </div>
          ))}
      </section>
    </>
  );
}
