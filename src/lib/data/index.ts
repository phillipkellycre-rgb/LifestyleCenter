import { EX_SRC, FOOD_SRC, RECIPE_SRC } from "./source";
import type { Exercise, FoodItem, MuscleGroup, Equipment, Recipe, SlotCode } from "@/lib/domain/types";

function parseExercises(): Exercise[] {
  return EX_SRC.trim()
    .split("\n")
    .map((l, i) => {
      const [name, group, equip, inc, comp] = l.split("|");
      return {
        id: i,
        name,
        group: group as MuscleGroup,
        equip: equip as Equipment,
        inc: +inc,
        compound: comp === "1",
      };
    });
}

function parseFoods(): FoodItem[] {
  return FOOD_SRC.trim()
    .split("\n")
    .map((l, i) => {
      const [name, cal, p, c, f, base] = l.split("|");
      return { id: i, name, cal: +cal, p: +p, c: +c, f: +f, base };
    });
}

function parseRecipes(): Recipe[] {
  return RECIPE_SRC.trim()
    .split("\n")
    .map((l, i) => {
      const [head, steps] = l.split("#");
      const parts = head.split("|");
      const ingredients = parts.slice(8).map((s) => {
        const [name, qty, aisle] = s.split("~");
        return { name, qty, aisle };
      });
      return {
        id: i,
        name: parts[0],
        slot: parts[1] as SlotCode,
        cal: +parts[2],
        p: +parts[3],
        c: +parts[4],
        f: +parts[5],
        fiber: +parts[6],
        time: +parts[7],
        ingredients,
        steps: (steps || "").split("|").filter(Boolean),
      };
    });
}

export const EXERCISES: Exercise[] = parseExercises();
export const FOODS: FoodItem[] = parseFoods();
export const RECIPES: Recipe[] = parseRecipes();

export const exByName: Record<string, Exercise> = {};
EXERCISES.forEach((e) => {
  exByName[e.name] = e;
});

export const SPLITS: Record<3 | 4 | 5, [string, string[]][]> = {
  3: [
    ["Full Body A", ["Back Squat", "Barbell Bench Press", "Barbell Row", "Lateral Raise", "Plank"]],
    ["Full Body B", ["Romanian Deadlift", "Overhead Press", "Lat Pulldown", "Dumbbell Curl", "Hanging Leg Raise"]],
    ["Full Body C", ["Leg Press", "Incline Dumbbell Press", "Seated Cable Row", "Triceps Rope Pushdown", "Cable Crunch"]],
  ],
  4: [
    ["Upper A", ["Barbell Bench Press", "Barbell Row", "Overhead Press", "Lat Pulldown", "Dumbbell Curl", "Triceps Rope Pushdown"]],
    ["Lower A", ["Back Squat", "Romanian Deadlift", "Leg Press", "Standing Calf Raise", "Hanging Leg Raise"]],
    ["Upper B", ["Incline Dumbbell Press", "Pull-Up", "Seated Dumbbell Press", "Chest-Supported Row", "Hammer Curl", "Overhead Cable Extension"]],
    ["Lower B", ["Conventional Deadlift", "Bulgarian Split Squat", "Lying Leg Curl", "Seated Calf Raise", "Cable Crunch"]],
  ],
  5: [
    ["Push", ["Barbell Bench Press", "Seated Dumbbell Press", "Incline Dumbbell Press", "Cable Crossover", "Triceps Rope Pushdown", "Lateral Raise"]],
    ["Pull", ["Barbell Row", "Lat Pulldown", "Seated Cable Row", "Face Pull", "Barbell Curl", "Hammer Curl"]],
    ["Legs", ["Back Squat", "Romanian Deadlift", "Leg Press", "Lying Leg Curl", "Standing Calf Raise"]],
    ["Upper", ["Overhead Press", "Pull-Up", "Machine Chest Press", "Chest-Supported Row", "Skullcrusher", "Incline Curl"]],
    ["Lower", ["Conventional Deadlift", "Front Squat", "Bulgarian Split Squat", "Seated Leg Curl", "Hanging Leg Raise"]],
  ],
};

export const SLOTS: import("@/lib/domain/types").MealSlot[] = ["Breakfast", "Lunch", "Snack", "Dinner"];
export const SLOT_CODE: Record<import("@/lib/domain/types").MealSlot, SlotCode> = {
  Breakfast: "B",
  Lunch: "L",
  Snack: "S",
  Dinner: "D",
};
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
/** Single-letter Mon-start weekday header for calendar grids. */
export const WEEKDAY_LETTERS = DAYS.map((d) => d[0]);

/** Indexed directly by JS Date.getDay() (0=Sun..6=Sat) — for workoutDays labels. */
export const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const TAB_ICONS: Record<string, string> = {
  today: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 3",
  train: "M6 7v10M18 7v10M2 10v4M22 10v4M6 12h12",
  fuel: "M18 2v6a2 2 0 01-2 2h-1v10M8 2v6a2 2 0 002 2h1M11 2v18",
  progress: "M4 20V10M12 20V4M20 20v-7",
  wellness: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};
