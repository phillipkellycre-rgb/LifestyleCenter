import type { ActivityLevel, Profile, Targets } from "./types";

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  Sedentary: 1.25,
  Light: 1.375,
  Moderate: 1.55,
  High: 1.725,
  Athlete: 1.9,
};

/** BMR (Mifflin-St Jeor), TDEE and macro targets. Ported from the prototype's computeTargets. */
export function computeTargets(p: Profile): Targets {
  const kg = (p.weight || 180) * 0.4536;
  const cm = (p.heightIn || 70) * 2.54;
  const s = p.sex === "Female" ? -161 : 5;
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * (p.age || 30) + s);
  const mult = ACTIVITY_MULT[p.activity] || 1.55;
  const tdee = Math.round(bmr * mult);
  const goals = p.goals || [];
  let kcal = tdee;
  if (goals.includes("Fat loss")) kcal = Math.round(tdee - 500);
  else if (goals.includes("Muscle gain")) kcal = Math.round(tdee + 300);
  if (p.kcalOverride) kcal = p.kcalOverride;
  let protein = Math.round((p.weight || 180) * (goals.includes("Fat loss") ? 1.0 : 0.9));
  if (p.proteinOverride) protein = p.proteinOverride;
  const fat = Math.round((p.weight || 180) * 0.38);
  const carbs = Math.max(60, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr, tdee, kcal, protein, carbs, fat, fiber: Math.round((kcal / 1000) * 14) };
}
