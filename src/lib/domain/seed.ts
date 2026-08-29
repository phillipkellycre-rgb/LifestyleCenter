import { computeTargets } from "./calc";
import { buildMealPlan } from "./mealPlan";
import { buildProgram } from "./program";
import { iso } from "./util";
import type { Db, Profile } from "./types";

export function defaultProfile(): Profile {
  return {
    name: "You",
    age: 32,
    sex: "Male",
    heightIn: 70,
    weight: 180,
    activity: "Moderate",
    goals: ["General fitness"],
    daysPerWeek: 4,
    targetWeight: 170,
    kcalOverride: null,
    proteinOverride: null,
  };
}

/**
 * A real, empty account: the built-in exercise/food/recipe library and a
 * program + meal plan generated from the default profile, but zero logged
 * history, food entries, cardio or measurements. The only "seeded" number is
 * today's starting bodyweight, taken straight from the profile — not demo
 * data. Fill in Profile & Targets (More tab) with real numbers, then tap
 * "Rebuild program" to regenerate the plan from them.
 */
export function emptyState(): Db {
  const profile = defaultProfile();
  const targets = computeTargets(profile);
  const program = buildProgram(profile);
  const today = iso(new Date());
  return {
    profile,
    program,
    history: [],
    customFoods: [],
    weights: [{ date: today, lb: profile.weight }],
    measures: {
      Waist: [0, 0],
      Chest: [0, 0],
      Arms: [0, 0],
      Thighs: [0, 0],
      Hips: [0, 0],
    },
    foodLog: {},
    water: {},
    mealPlan: buildMealPlan(targets),
    grocery: {},
    cardio: [],
    bloodPressure: [],
    recovery: {},
    chat: [],
    selWeek: 1,
    completedToday: [],
  };
}
