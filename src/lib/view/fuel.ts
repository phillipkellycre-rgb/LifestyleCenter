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
  return AISLE_ORDER.map((aisle) => ({
    name: aisle,
    items: Object.keys(bag)
      .filter((k) => bag[k].aisle === aisle)
      .sort()
      .map((k) => ({
        key: k,
        name: bag[k].name,
        qty: bag[k].n > 1 ? `${bag[k].n} × ${bag[k].qty}` : bag[k].qty,
        checked: !!(db.grocery || {})[k],
      })),
  })).filter((g) => g.items.length);
}
