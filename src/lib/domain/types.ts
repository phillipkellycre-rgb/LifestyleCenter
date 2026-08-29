export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core"
  | "Full body";

export type Equipment = "Barbell" | "Dumbbells" | "Machines" | "Bodyweight" | "Other";

export interface Exercise {
  id: number;
  name: string;
  group: MuscleGroup;
  equip: Equipment;
  /** Load increment in lb per progression step (0 for bodyweight moves). */
  inc: number;
  compound: boolean;
}

export interface FoodItem {
  id: number;
  name: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  base: string;
}

export type MealSlot = "Breakfast" | "Lunch" | "Snack" | "Dinner";
export type SlotCode = "B" | "L" | "S" | "D";

export interface RecipeIngredient {
  name: string;
  qty: string;
  aisle: string;
}

export interface Recipe {
  id: number;
  name: string;
  slot: SlotCode;
  cal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
  time: number;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface ProgramExercise {
  exId: number;
  sets: number;
  repLow: number;
  repHigh: number;
  weight: number;
}

export interface ProgramDay {
  name: string;
  dayIndex: number;
  exercises: ProgramExercise[];
}

export interface Program {
  title: string;
  weeks: 12;
  startDate: string;
  days: ProgramDay[];
}

export type Sex = "Male" | "Female";
export type ActivityLevel = "Sedentary" | "Light" | "Moderate" | "High" | "Athlete";
export type Goal =
  | "Fat loss"
  | "Muscle gain"
  | "Strength"
  | "General fitness"
  | "Endurance"
  | "Recomposition"
  | "Maintenance";

export interface Profile {
  name: string;
  age: number;
  sex: Sex;
  heightIn: number;
  weight: number;
  activity: ActivityLevel;
  goals: Goal[];
  daysPerWeek: 3 | 4 | 5;
  targetWeight: number;
  kcalOverride: number | null;
  proteinOverride: number | null;
}

export interface Targets {
  bmr: number;
  tdee: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface SessionSet {
  w: number;
  r: number;
  rpe: number;
}

export interface SessionEntry {
  exId: number;
  sets: SessionSet[];
}

export interface SessionFeedback {
  energy: number;
  difficulty: number;
  soreness: number;
  overall: number;
}

export interface Session {
  date: string;
  dayIndex: number;
  name: string;
  week: number;
  entries: SessionEntry[];
  feedback: SessionFeedback;
}

export interface BodyWeightEntry {
  date: string;
  lb: number;
}

export type MeasurementSite = "Waist" | "Chest" | "Arms" | "Thighs" | "Hips";
/** [start, current] in inches. */
export type MeasurementPair = [number, number];

export interface FoodLogEntry {
  name: string;
  qty: number;
  cal: number;
  p: number;
  c: number;
  f: number;
}

export type FoodLog = Record<string, Record<MealSlot, FoodLogEntry[]>>;

export interface PlannedMeal {
  slot: MealSlot;
  recipeId: number;
}

export interface MealPlanDay {
  day: string;
  meals: PlannedMeal[];
}

export type MealPlan = MealPlanDay[];

export interface CardioSession {
  type: string;
  min: number;
  dist: number;
  hr: number;
  date: string;
}

export interface RecoveryLog {
  sleep: number;
  energy: number;
  soreness: number;
  stress: number;
}

export interface ChatMessage {
  who: "You" | "Coach";
  text: string;
}

export interface Db {
  profile: Profile;
  program: Program;
  history: Session[];
  weights: BodyWeightEntry[];
  measures: Record<MeasurementSite, MeasurementPair>;
  foodLog: FoodLog;
  water: Record<string, number>;
  mealPlan: MealPlan;
  grocery: Record<string, number>;
  cardio: CardioSession[];
  recovery: Record<string, RecoveryLog>;
  chat: ChatMessage[];
  selWeek: number;
  completedToday: number[];
}

export type Phase = "Foundation" | "Overload" | "Intensify" | "Deload";

export interface ProgressionResult {
  weight: number;
  reps: number;
  sets: number;
  why: string;
  last: { session: Session; entry: SessionEntry } | null;
  inc: number;
}
