import { DAYS, RECIPES, SLOT_CODE, SLOTS } from "@/lib/data";
import type { MealPlan, SlotCode, Targets } from "./types";

const SLOT_SHARE: Record<SlotCode, number> = { B: 0.25, L: 0.32, S: 0.1, D: 0.33 };

/**
 * Assigns a recipe to each slot per day by calorie share, picking the
 * closest-fitting recipe and rotating across the top-3 matches by day index
 * so the week isn't identical every day.
 */
export function buildMealPlan(targets: Targets): MealPlan {
  const byCode = (c: SlotCode) => RECIPES.filter((r) => r.slot === c);
  return DAYS.map((day, di) => ({
    day,
    meals: SLOTS.map((slot) => {
      const code = SLOT_CODE[slot];
      const pool = byCode(code);
      const want = targets.kcal * SLOT_SHARE[code];
      const sorted = pool.slice().sort((a, b) => Math.abs(a.cal - want) - Math.abs(b.cal - want));
      return { slot, recipeId: sorted[di % Math.min(3, sorted.length)].id };
    }),
  }));
}
