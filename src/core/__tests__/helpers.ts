import { buildCarbLoadingPlan, parseCarbLoadingInput } from "../index";
import type { CarbLoadingInput, CarbLoadingPlan } from "../types";

/** Defaults of the golden cases, plus the values the cases leave open. */
export const BASE = {
  today: "2026-11-01",
  raceDate: "2026-11-15",
  startTime: "09:00",
  weightKg: 70,
  age: 30,
  sex: "male",
  sport: "road_running",
  durationMin: 210,
  giHistory: "none",
  ibsDiagnosed: false,
  coeliac: false,
  lactoseIntolerance: false,
  usualDiet: "mixed",
  daysSinceLastRace: "none",
  loadingDays: 2,
  lastHardSession: { kind: "date", date: "2026-11-12" }, // D−3: compatible with 2 days
  raceCarbs: "dont_know",
  preMealHours: 2,
  bigMealTolerance: "normal",
  diabetes: "no",
  pregnant: false,
  eatingDisorderHistory: "no",
  redsOrLowEnergyDiagnosis: false,
  amenorrhea3Months: false,
} as const;

/** Useful dates: D−1, D−2, D−3 of the base race. */
export const G1 = "2026-11-14";
export const G2 = "2026-11-13";
export const G3 = "2026-11-12";

export function makeInput(overrides: Record<string, unknown> = {}): CarbLoadingInput {
  const raw = { ...BASE, ...overrides };
  const res = parseCarbLoadingInput(raw, raw.today as string);
  if (!res.ok) throw new Error(`invalid test input: ${JSON.stringify(res.errors)}`);
  return res.input;
}

export function planOf(overrides: Record<string, unknown> = {}): CarbLoadingPlan {
  return buildCarbLoadingPlan(makeInput(overrides));
}

export function loadingPlanOf(overrides: Record<string, unknown> = {}) {
  const plan = planOf(overrides);
  if (plan.loading !== "yes") throw new Error(`expected a loading plan, got ${plan.loading}`);
  return plan;
}

export const warningCodes = (plan: CarbLoadingPlan): string[] => plan.warnings.map((w) => w.code).sort();
