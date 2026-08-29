"use client";

import { create } from "zustand";
import { EXERCISES, RECIPES, SLOT_CODE } from "@/lib/data";
import { computeTargets } from "@/lib/domain/calc";
import { askCoach } from "@/lib/domain/coach";
import { buildMealPlan } from "@/lib/domain/mealPlan";
import { buildProgram, phaseFor, seedWeightFor } from "@/lib/domain/program";
import { progression } from "@/lib/domain/progression";
import { emptyState } from "@/lib/domain/seed";
import { currentWeek, today, todayDayIndex } from "@/lib/domain/selectors";
import { clamp } from "@/lib/domain/util";
import { dbRepository } from "@/lib/repository/dbRepository";
import type { Db, FoodItem, MealSlot, MeasurementSite, Recipe, SessionFeedback } from "@/lib/domain/types";
import {
  CARDIO_TYPES,
  defaultBpDraft,
  defaultCustomFoodDraft,
  defaultFeedback,
  type BpDraft,
  type CardioDraft,
  type CustomFoodDraft,
  type SheetOption,
  type SheetState,
  type TabId,
  type WorkoutSession,
} from "./uiTypes";

interface StoreState {
  hydrated: boolean;
  db: Db;

  tab: TabId;
  exQuery: string;
  exGroup: string;
  foodQuery: string;
  planView: "plan" | "grocery";

  sheet: SheetState | null;
  sheetQty: number;
  sheetSlot: MealSlot;
  customFoodDraft: CustomFoodDraft;

  weightInput: string;
  weightError: string;

  cardioDraft: CardioDraft;
  cardioError: string;

  bpDraft: BpDraft;
  bpError: string;

  measureDraft: Partial<Record<MeasurementSite, string>>;
  chatDraft: string;

  toast: string;

  session: WorkoutSession | null;
  rest: number;
  feedback: SessionFeedback;

  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  edit: (fn: (db: Db) => void) => void;
  flash: (msg: string) => void;
  setTab: (tab: TabId) => void;

  setExQuery: (q: string) => void;
  setExGroup: (g: string) => void;
  setFoodQuery: (q: string) => void;
  setPlanView: (v: "plan" | "grocery") => void;

  openFoodSheet: (food: FoodItem) => void;
  openRecipeSheet: (recipe: Recipe, slot: MealSlot) => void;
  openOptionsSheet: (title: string, subtitle: string, options: SheetOption[]) => void;
  openCustomFoodSheet: (presetName: string) => void;
  openEditFoodEntry: (slot: MealSlot, index: number) => void;
  updateFoodLogEntry: (macros: { cal: number; p: number; c: number; f: number }) => void;
  closeSheet: () => void;
  setSheetSlot: (slot: MealSlot) => void;
  qtyUp: () => void;
  qtyDown: () => void;
  confirmLog: (macros: { cal: number; p: number; c: number; f: number }) => void;
  recipeLog: (macros: { cal: number; p: number; c: number; f: number }) => void;
  recipeToGrocery: () => void;

  setCustomFoodField: (field: keyof CustomFoodDraft, value: string) => void;
  saveCustomFood: () => void;

  logFood: (slot: MealSlot, food: { name: string; cal: number; p: number; c: number; f: number }, qty: number) => void;
  addWater: (oz: number) => void;
  toggleExerciseDone: (exId: number) => void;

  toggleGrocery: (itemName: string) => void;
  swapMeal: (dayIndex: number, mealIndex: number) => void;

  startSession: (dayIndex: number) => void;
  startWorkout: () => void;
  updateSessionRow: (rowIndex: number, field: "w" | "r" | "rpe", value: string) => void;
  toggleSessionRow: (rowIndex: number) => void;
  addSet: () => void;
  dropSet: () => void;
  openSwapExercise: () => void;
  swapProgramExercise: (dayIndex: number, exIndex: number) => void;
  setRest: (n: number) => void;
  tickRest: () => void;
  prevExercise: () => void;
  nextExercise: () => void;
  quitSession: () => void;
  setFeedbackField: (field: keyof SessionFeedback, value: number) => void;
  submitFeedback: () => void;

  setWeightInput: (v: string) => void;
  saveWeight: () => void;
  setMeasureDraft: (site: MeasurementSite, v: string) => void;
  commitMeasure: (site: MeasurementSite) => void;
  setCardioField: (field: keyof CardioDraft, v: string) => void;
  saveCardio: () => void;
  setBpField: (field: keyof BpDraft, v: string) => void;
  saveBp: () => void;

  setChatDraft: (v: string) => void;
  sendChat: () => void;
  askCoachPrompt: (q: string) => void;

  rebuildProgram: () => void;
  resetAll: () => Promise<void>;

  setProfileField: (field: keyof Db["profile"], value: string | number | null) => void;
  toggleGoal: (goal: Db["profile"]["goals"][number]) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let pendingSave: Db | null = null;
const SAVE_DEBOUNCE_MS = 400;

/** Flushes any debounced save immediately — call before the page hides/unloads. */
export function flushPendingSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = undefined;
  if (pendingSave) {
    const db = pendingSave;
    pendingSave = null;
    void dbRepository.save(db);
  }
}

function scheduleSave(db: Db): void {
  pendingSave = db;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushPendingSave, SAVE_DEBOUNCE_MS);
}

export const useStore = create<StoreState>((set, get) => ({
  hydrated: false,
  db: emptyState(),

  tab: "today",
  exQuery: "",
  exGroup: "All",
  foodQuery: "",
  planView: "plan",

  sheet: null,
  sheetQty: 1,
  sheetSlot: "Lunch",
  customFoodDraft: defaultCustomFoodDraft(),

  weightInput: "",
  weightError: "",

  cardioDraft: { type: CARDIO_TYPES[0], min: "", dist: "", hr: "" },
  cardioError: "",

  bpDraft: defaultBpDraft(),
  bpError: "",

  measureDraft: {},
  chatDraft: "",

  toast: "",

  session: null,
  rest: 0,
  feedback: defaultFeedback(),

  hydrate: async () => {
    if (get().hydrated) return;
    const db = await dbRepository.load();
    set({ db, hydrated: true });
  },

  refresh: async () => {
    // A pending local edit hasn't reached the server yet — flush it instead
    // of overwriting it with a stale server copy.
    if (pendingSave) {
      flushPendingSave();
      return;
    }
    const db = await dbRepository.load();
    set({ db });
  },

  edit: (fn) => {
    const db: Db = JSON.parse(JSON.stringify(get().db));
    fn(db);
    set({ db });
    scheduleSave(db);
  },

  flash: (msg) => {
    set({ toast: msg });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: "" }), 2200);
  },

  setTab: (tab) => set({ tab, sheet: null }),

  setExQuery: (exQuery) => set({ exQuery }),
  setExGroup: (exGroup) => set({ exGroup }),
  setFoodQuery: (foodQuery) => set({ foodQuery }),
  setPlanView: (planView) => set({ planView }),

  openFoodSheet: (food) => set({ sheet: { kind: "food", food }, sheetQty: 1 }),
  openRecipeSheet: (recipe, slot) => set({ sheet: { kind: "recipe", recipe, slot } }),
  openOptionsSheet: (title, subtitle, options) => set({ sheet: { kind: "options", title, subtitle, options } }),
  openCustomFoodSheet: (presetName) =>
    set({ sheet: { kind: "customFood", presetName }, customFoodDraft: defaultCustomFoodDraft(presetName) }),
  openEditFoodEntry: (slot, index) => {
    const entry = (get().db.foodLog[today()] || {})[slot]?.[index];
    if (!entry) return;
    set({ sheet: { kind: "editFoodEntry", slot, index, name: entry.name } });
  },
  updateFoodLogEntry: (macros) => {
    const { sheet } = get();
    if (!sheet || sheet.kind !== "editFoodEntry") return;
    const dateStr = today();
    get().edit((db) => {
      const entry = db.foodLog[dateStr]?.[sheet.slot]?.[sheet.index];
      if (!entry) return;
      entry.cal = macros.cal;
      entry.p = macros.p;
      entry.c = macros.c;
      entry.f = macros.f;
    });
    set({ sheet: null });
    get().flash("Entry updated");
  },
  closeSheet: () => set({ sheet: null }),
  setSheetSlot: (sheetSlot) => set({ sheetSlot }),
  qtyUp: () => set((s) => ({ sheetQty: Math.round((s.sheetQty + 0.5) * 10) / 10 })),
  qtyDown: () => set((s) => ({ sheetQty: Math.max(0.5, Math.round((s.sheetQty - 0.5) * 10) / 10) })),

  confirmLog: (macros) => {
    const { sheet, sheetSlot } = get();
    if (!sheet || sheet.kind !== "food") return;
    // macros are already the final (possibly hand-edited) totals for this
    // entry, so log at qty 1 — logFood's qty multiplier would double-apply
    // the scaling the sheet already did.
    get().logFood(sheetSlot, { name: sheet.food.name, ...macros }, 1);
    set({ sheet: null, foodQuery: "" });
  },

  recipeLog: (macros) => {
    const { sheet } = get();
    if (!sheet || sheet.kind !== "recipe") return;
    get().logFood(sheet.slot, { name: sheet.recipe.name, ...macros }, 1);
    set({ sheet: null });
  },

  recipeToGrocery: () => {
    const { sheet } = get();
    if (!sheet || sheet.kind !== "recipe") return;
    const r = sheet.recipe;
    get().edit((db) => {
      db.grocery = db.grocery || {};
      r.ingredients.forEach((i) => {
        delete db.grocery[i.name];
      });
    });
    set({ sheet: null });
    get().flash(r.ingredients.length + " ingredients on the list");
  },

  setCustomFoodField: (field, value) => set((s) => ({ customFoodDraft: { ...s.customFoodDraft, [field]: value } })),

  saveCustomFood: () => {
    const d = get().customFoodDraft;
    const name = d.name.trim();
    const cal = parseFloat(d.cal);
    if (!name || isNaN(cal)) return;
    get().edit((db) => {
      db.customFoods = db.customFoods || [];
      db.customFoods.push({
        id: Date.now(),
        name,
        cal: Math.round(cal),
        p: Math.round(parseFloat(d.p) || 0),
        c: Math.round(parseFloat(d.c) || 0),
        f: Math.round(parseFloat(d.f) || 0),
        base: d.base.trim() || "per serving",
      });
    });
    set({ sheet: null });
    get().flash(name + " added to your foods");
  },

  logFood: (slot, food, qty) => {
    const date = today();
    get().edit((db) => {
      db.foodLog = db.foodLog || ({} as Db["foodLog"]);
      db.foodLog[date] = db.foodLog[date] || { Breakfast: [], Lunch: [], Snack: [], Dinner: [] };
      db.foodLog[date][slot] = db.foodLog[date][slot] || [];
      db.foodLog[date][slot].push({
        name: food.name + (qty !== 1 ? " ×" + qty : ""),
        qty,
        cal: Math.round(food.cal * qty),
        p: Math.round(food.p * qty),
        c: Math.round(food.c * qty),
        f: Math.round(food.f * qty),
      });
    });
    get().flash(Math.round(food.cal * qty) + " kcal logged to " + slot);
  },

  addWater: (oz) => {
    const date = today();
    get().edit((db) => {
      db.water = db.water || {};
      db.water[date] = (db.water[date] || 0) + oz;
    });
  },

  toggleExerciseDone: (exId) => {
    get().edit((db) => {
      db.completedToday = db.completedToday || [];
      const ix = db.completedToday.indexOf(exId);
      if (ix >= 0) db.completedToday.splice(ix, 1);
      else db.completedToday.push(exId);
    });
  },

  toggleGrocery: (itemName) => {
    get().edit((db) => {
      db.grocery = db.grocery || {};
      if (db.grocery[itemName]) delete db.grocery[itemName];
      else db.grocery[itemName] = 1;
    });
  },

  swapMeal: (dayIndex, mealIndex) => {
    const db = get().db;
    const r = RECIPES[db.mealPlan[dayIndex].meals[mealIndex].recipeId];
    const slotCode = SLOT_CODE[db.mealPlan[dayIndex].meals[mealIndex].slot];
    const pool = RECIPES.filter((x) => x.slot === slotCode && x.id !== r.id).sort(
      (x, y) => Math.abs(x.cal - r.cal) + Math.abs(x.p - r.p) * 4 - (Math.abs(y.cal - r.cal) + Math.abs(y.p - r.p) * 4)
    );
    get().openOptionsSheet(
      "Swap " + r.name,
      "Matched to " + r.cal + " kcal and " + r.p + "g protein",
      pool.slice(0, 4).map((x) => ({
        name: x.name,
        detail: x.cal + " kcal · P" + x.p + " C" + x.c + " F" + x.f + " · " + x.time + " min",
        pick: () => {
          get().edit((d) => {
            d.mealPlan[dayIndex].meals[mealIndex].recipeId = x.id;
          });
          get().closeSheet();
          get().flash("Swapped in " + x.name);
        },
      }))
    );
  },

  startSession: (dayIndex) => {
    const db = get().db;
    const plan = db.program.days[dayIndex];
    const phase = phaseFor(currentWeek(db));
    const exercises = plan.exercises.map((pe) => {
      const pr = progression(pe, phase, db.history);
      return {
        exId: pe.exId,
        why: pr.why,
        target: pr.weight + " lb × " + pr.reps,
        rows: Array.from({ length: pr.sets }, () => ({ w: pr.weight, r: pr.reps, rpe: 8, done: false })),
      };
    });
    set({ session: { dayIndex, name: plan.name, i: 0, exercises }, sheet: null, rest: 0 });
  },

  startWorkout: () => get().startSession(todayDayIndex(get().db)),

  updateSessionRow: (rowIndex, field, value) => {
    set((s) => {
      if (!s.session) return s;
      const session: WorkoutSession = JSON.parse(JSON.stringify(s.session));
      const row = session.exercises[session.i].rows[rowIndex];
      const n = parseFloat(value);
      row[field] = isNaN(n) ? row[field] : n;
      return { session };
    });
  },

  toggleSessionRow: (rowIndex) => {
    set((s) => {
      if (!s.session) return s;
      const session: WorkoutSession = JSON.parse(JSON.stringify(s.session));
      const ex = EXERCISES[session.exercises[session.i].exId];
      const row = session.exercises[session.i].rows[rowIndex];
      row.done = !row.done;
      return { session, rest: row.done ? (ex.compound ? 180 : 90) : s.rest };
    });
  },

  addSet: () => {
    set((s) => {
      if (!s.session) return s;
      const session: WorkoutSession = JSON.parse(JSON.stringify(s.session));
      const rows = session.exercises[session.i].rows;
      rows.push({ ...rows[rows.length - 1], done: false });
      return { session };
    });
  },

  dropSet: () => {
    set((s) => {
      if (!s.session) return s;
      const session: WorkoutSession = JSON.parse(JSON.stringify(s.session));
      if (session.exercises[session.i].rows.length > 1) session.exercises[session.i].rows.pop();
      return { session };
    });
  },

  openSwapExercise: () => {
    const { session, db } = get();
    if (!session) return;
    const cur = session.exercises[session.i];
    const ex = EXERCISES[cur.exId];
    const phase = phaseFor(currentWeek(db));
    const alts = EXERCISES.filter((e) => e.id !== ex.id && e.group === ex.group).slice(0, 5);
    get().openOptionsSheet(
      "Substitute " + ex.name,
      "Same muscle group — your progression history moves with you",
      alts.map((alt) => ({
        name: alt.name,
        detail: alt.group + " · " + alt.equip + " · " + (alt.compound ? "compound" : "isolation"),
        pick: () => {
          set((s) => {
            if (!s.session) return s;
            const session2: WorkoutSession = JSON.parse(JSON.stringify(s.session));
            const planEx = {
              exId: alt.id,
              sets: session2.exercises[session2.i].rows.length,
              repLow: alt.compound ? 6 : 10,
              repHigh: alt.compound ? 8 : 14,
              weight: seedWeightFor(alt, db.profile.weight),
            };
            const pr = progression(planEx, phase, db.history);
            session2.exercises[session2.i] = {
              exId: alt.id,
              why: pr.why,
              target: pr.weight + " lb × " + pr.reps,
              rows: Array.from({ length: pr.sets }, () => ({ w: pr.weight, r: pr.reps, rpe: 8, done: false })),
            };
            return { session: session2, sheet: null };
          });
          get().flash("Swapped to " + alt.name);
        },
      }))
    );
  },

  swapProgramExercise: (dayIndex, exIndex) => {
    const db = get().db;
    const day = db.program.days[dayIndex];
    const current = day.exercises[exIndex];
    const ex = EXERCISES[current.exId];
    const alts = EXERCISES.filter((e) => e.id !== ex.id && e.group === ex.group).slice(0, 8);
    get().openOptionsSheet(
      "Replace " + ex.name,
      "Same muscle group — this changes " + day.name + " going forward",
      alts.map((alt) => ({
        name: alt.name,
        detail: alt.group + " · " + alt.equip + " · " + (alt.compound ? "compound" : "isolation"),
        pick: () => {
          get().edit((d) => {
            const pe = d.program.days[dayIndex].exercises[exIndex];
            pe.exId = alt.id;
            pe.repLow = alt.compound ? 6 : 10;
            pe.repHigh = alt.compound ? 8 : 14;
            pe.weight = seedWeightFor(alt, d.profile.weight);
          });
          get().closeSheet();
          get().flash(ex.name + " replaced with " + alt.name);
        },
      }))
    );
  },

  setRest: (n) => set({ rest: n }),
  tickRest: () => set((s) => ({ rest: Math.max(0, s.rest - 1) })),

  prevExercise: () => {
    set((s) => (s.session ? { session: { ...s.session, i: Math.max(0, s.session.i - 1) } } : s));
  },

  nextExercise: () => {
    const { session } = get();
    if (!session) return;
    if (session.i === session.exercises.length - 1) {
      set({ sheet: { kind: "feedback" } });
    } else {
      set({ session: { ...session, i: session.i + 1 }, rest: 0 });
    }
  },

  quitSession: () => set({ session: null, sheet: null }),

  setFeedbackField: (field, value) => set((s) => ({ feedback: { ...s.feedback, [field]: value } })),

  submitFeedback: () => {
    const { session, feedback } = get();
    if (!session) return;
    const week = currentWeek(get().db);
    get().edit((db) => {
      db.history.push({
        date: today(),
        dayIndex: session.dayIndex,
        name: session.name,
        week,
        entries: session.exercises
          .map((e) => ({
            exId: e.exId,
            sets: e.rows.filter((r) => r.done).map((r) => ({ w: r.w || 0, r: r.r || 0, rpe: r.rpe || 8 })),
          }))
          .filter((e) => e.sets.length),
        feedback,
      });
      db.completedToday = [];
    });
    set({ session: null, sheet: null });
    get().flash("Session saved — next week's targets updated");
  },

  setWeightInput: (weightInput) => set({ weightInput, weightError: "" }),
  saveWeight: () => {
    const n = parseFloat(get().weightInput);
    if (isNaN(n) || n < 60 || n > 700) {
      set({ weightError: "Enter a weight between 60 and 700 lb." });
      return;
    }
    const date = today();
    get().edit((db) => {
      db.weights = db.weights.filter((x) => x.date !== date).concat([{ date, lb: Math.round(n * 10) / 10 }]);
      db.weights.sort((x, y) => (x.date < y.date ? -1 : 1));
      db.profile.weight = Math.round(n * 10) / 10;
    });
    set({ weightInput: "", weightError: "" });
    get().flash("Weight logged — targets recalculated");
  },

  setMeasureDraft: (site, v) => set((s) => ({ measureDraft: { ...s.measureDraft, [site]: v } })),
  commitMeasure: (site) => {
    const n = parseFloat(get().measureDraft[site] ?? "");
    if (isNaN(n) || n <= 0) return;
    get().edit((db) => {
      db.measures[site][1] = Math.round(n * 10) / 10;
    });
    set((s) => ({ measureDraft: { ...s.measureDraft, [site]: "" } }));
  },

  setCardioField: (field, v) => set((s) => ({ cardioDraft: { ...s.cardioDraft, [field]: v }, cardioError: "" })),
  saveCardio: () => {
    const c = get().cardioDraft;
    const min = parseFloat(c.min);
    if (isNaN(min) || min <= 0) {
      set({ cardioError: "Minutes is required." });
      return;
    }
    get().edit((db) => {
      db.cardio = [
        { type: c.type, min, dist: parseFloat(c.dist) || 0, hr: parseFloat(c.hr) || 0, date: today() },
        ...db.cardio,
      ];
    });
    set({ cardioDraft: { type: c.type, min: "", dist: "", hr: "" }, cardioError: "" });
    get().flash(c.type + " logged");
  },

  setBpField: (field, v) => set((s) => ({ bpDraft: { ...s.bpDraft, [field]: v }, bpError: "" })),
  saveBp: () => {
    const d = get().bpDraft;
    const systolic = parseFloat(d.systolic);
    const diastolic = parseFloat(d.diastolic);
    if (isNaN(systolic) || isNaN(diastolic) || systolic <= 0 || diastolic <= 0) {
      set({ bpError: "Systolic and diastolic are both required." });
      return;
    }
    get().edit((db) => {
      db.bloodPressure = [
        { systolic, diastolic, pulse: parseFloat(d.pulse) || 0, date: today() },
        ...(db.bloodPressure || []),
      ];
    });
    set({ bpDraft: defaultBpDraft(), bpError: "" });
    get().flash(`${systolic}/${diastolic} logged`);
  },

  setChatDraft: (chatDraft) => set({ chatDraft }),
  sendChat: () => {
    const q = get().chatDraft.trim();
    if (!q) return;
    get().askCoachPrompt(q);
    set({ chatDraft: "" });
  },
  askCoachPrompt: (q) => {
    const ans = askCoach(get().db, q);
    get().edit((db) => {
      const turn: Db["chat"] = [
        { who: "You", text: q },
        { who: "Coach", text: ans },
      ];
      db.chat = turn.concat(db.chat || []).slice(0, 12);
    });
  },

  rebuildProgram: () => {
    get().edit((db) => {
      db.program = buildProgram(db.profile, db.program.startDate);
      db.mealPlan = buildMealPlan(computeTargets(db.profile));
    });
    get().flash("Program and meal plan rebuilt");
  },

  resetAll: async () => {
    const fresh = await dbRepository.reset();
    set({ db: fresh });
    get().flash("All data reset");
  },

  setProfileField: (field, value) => {
    get().edit((db) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.profile as any)[field] = value;
    });
  },
  toggleGoal: (goal) => {
    get().edit((db) => {
      db.profile.goals = db.profile.goals || [];
      const ix = db.profile.goals.indexOf(goal);
      if (ix >= 0) db.profile.goals.splice(ix, 1);
      else db.profile.goals.push(goal);
    });
  },
}));

export const clampPct = (n: number) => clamp(n, 0, 1);
