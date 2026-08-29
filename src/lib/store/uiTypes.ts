import type { FoodItem, MealSlot, Recipe, SessionFeedback } from "@/lib/domain/types";

export type TabId = "today" | "train" | "fuel" | "progress" | "more";

export interface WorkoutSessionRow {
  w: number;
  r: number;
  rpe: number;
  done: boolean;
}

export interface WorkoutSessionExercise {
  exId: number;
  why: string;
  target: string;
  rows: WorkoutSessionRow[];
}

export interface WorkoutSession {
  dayIndex: number;
  name: string;
  /** index of the exercise currently on screen */
  i: number;
  exercises: WorkoutSessionExercise[];
}

export interface SheetOption {
  name: string;
  detail: string;
  pick: () => void;
}

export type SheetState =
  | { kind: "food"; food: FoodItem }
  | { kind: "recipe"; recipe: Recipe; slot: MealSlot }
  | { kind: "options"; title: string; subtitle: string; options: SheetOption[] }
  | { kind: "feedback" }
  | { kind: "customFood"; presetName: string };

export interface CustomFoodDraft {
  name: string;
  cal: string;
  p: string;
  c: string;
  f: string;
  base: string;
}

export const defaultCustomFoodDraft = (presetName = ""): CustomFoodDraft => ({
  name: presetName,
  cal: "",
  p: "",
  c: "",
  f: "",
  base: "",
});

export interface CardioDraft {
  type: string;
  min: string;
  dist: string;
  hr: string;
}

export const CARDIO_TYPES = ["Running", "Walking", "Cycling", "Swimming", "Rowing", "Stairmaster", "Elliptical"];

export const defaultFeedback = (): SessionFeedback => ({ energy: 7, difficulty: 7, soreness: 4, overall: 8 });
