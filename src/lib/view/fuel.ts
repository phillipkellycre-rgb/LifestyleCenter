import { RECIPES } from "@/lib/data";
import { fmt } from "@/lib/domain/util";
import type { Db, MealSlot } from "@/lib/domain/types";

export interface DiarySlotVM {
  slot: MealSlot;
  kcal: string;
  note: string;
  empty: boolean;
  emptyText: string;
  items: { name: string; kcal: number; macros: string; index: number }[];
}

export function diaryView(db: Db, dateStr: string): DiarySlotVM[] {
  const log = db.foodLog[dateStr] || ({} as Db["foodLog"][string]);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const mealDay = db.mealPlan[todayIdx] || db.mealPlan[0];
  return (["Breakfast", "Lunch", "Snack", "Dinner"] as MealSlot[]).map((slot) => {
    const items = log[slot] || [];
    const planned = mealDay.meals.find((m) => m.slot === slot);
    const r = planned ? RECIPES[planned.recipeId] : null;
    return {
      slot,
      kcal: fmt(items.reduce((x, i) => x + i.cal, 0)),
      note: items.length ? "kcal" : `kcal · planned ${r ? r.cal : 0}`,
      empty: items.length === 0,
      emptyText: r ? `Planned: ${r.name}` : "Not logged yet",
      items: items.map((i, ix) => ({
        name: i.name,
        kcal: i.cal,
        macros: `P ${i.p}g · C ${i.c}g · F ${i.f}g`,
        index: ix,
      })),
    };
  });
}

export interface PlanMealVM {
  mealIndex: number;
  name: string;
  meta: string;
}

export interface PlanDayVM {
  dayIndex: number;
  day: string;
  isToday: boolean;
  total: string;
  meals: PlanMealVM[];
}

export function planView(db: Db): PlanDayVM[] {
  const todayIdx = (new Date().getDay() + 6) % 7;
  return db.mealPlan.map((d, di) => {
    const recipes = d.meals.map((m) => RECIPES[m.recipeId]);
    return {
      dayIndex: di,
      day: d.day,
      isToday: di === todayIdx,
      total: `${fmt(recipes.reduce((x, r) => x + r.cal, 0))} kcal · ${recipes.reduce((x, r) => x + r.p, 0)}g P`,
      meals: d.meals.map((m, mi) => {
        const r = RECIPES[m.recipeId];
        return {
          mealIndex: mi,
          name: r.name,
          meta: `${m.slot} · ${r.cal} kcal · P${r.p} C${r.c} F${r.f}`,
        };
      }),
    };
  });
}

const AISLE_ORDER = ["Produce", "Meat", "Seafood", "Dairy", "Grains", "Pantry", "Other"];

export interface GroceryItemVM {
  key: string;
  name: string;
  qty: string;
  checked: boolean;
}

export interface GroceryGroupVM {
  name: string;
  items: GroceryItemVM[];
}

export function groceryView(db: Db): GroceryGroupVM[] {
  const removed = db.groceryRemoved || {};
  const bag: Record<string, { name: string; aisle: string; n: number; qty: string }> = {};
  db.mealPlan.forEach((d) =>
    d.meals.forEach((m) =>
      RECIPES[m.recipeId].ingredients.forEach((i) => {
        const key = i.name;
        bag[key] = bag[key] || {
          name: i.name,
          aisle: AISLE_ORDER.includes(i.aisle) ? i.aisle : "Other",
          n: 0,
          qty: i.qty,
        };
        bag[key].n += 1;
      })
    )
  );
  const groups = AISLE_ORDER.map((aisle) => ({
    name: aisle,
    items: Object.keys(bag)
      .filter((k) => bag[k].aisle === aisle && !removed[k])
      .sort()
      .map((k) => ({
        key: k,
        name: bag[k].name,
        qty: bag[k].n > 1 ? `${bag[k].n} × ${bag[k].qty}` : bag[k].qty,
        checked: !!(db.grocery || {})[k],
      })),
  })).filter((g) => g.items.length);

  const custom = (db.groceryCustom || []).filter((c) => !removed[c.key]);
  if (custom.length) {
    groups.push({
      name: "Added by you",
      items: custom.map((c) => ({
        key: c.key,
        name: c.name,
        qty: c.qty,
        checked: !!(db.grocery || {})[c.key],
      })),
    });
  }
  return groups;
}

export interface GroceryCatalogItemVM {
  name: string;
  qty: string;
  aisle: string;
}

/**
 * Every ingredient across every recipe in the app (not just this week's
 * plan), deduped by name — the pickable pool for bundling a store run
 * together in one go instead of typing items in one at a time.
 */
export const GROCERY_CATALOG: GroceryCatalogItemVM[] = (() => {
  const seen = new Map<string, GroceryCatalogItemVM>();
  RECIPES.forEach((r) =>
    r.ingredients.forEach((i) => {
      const key = i.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { name: i.name, qty: i.qty, aisle: AISLE_ORDER.includes(i.aisle) ? i.aisle : "Other" });
      }
    })
  );
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
})();

/** True if an item with this name is already visible on the grocery list (derived or custom, not removed). */
export function groceryHasItem(db: Db, name: string): boolean {
  const key = name.toLowerCase();
  const removed = db.groceryRemoved || {};
  const inCustom = (db.groceryCustom || []).some((c) => c.name.toLowerCase() === key && !removed[c.key]);
  if (inCustom) return true;
  return db.mealPlan.some((d) =>
    d.meals.some((m) =>
      RECIPES[m.recipeId].ingredients.some((i) => i.name.toLowerCase() === key && !removed[i.name])
    )
  );
}
