import {
  THRESHOLDS as T,
  defaultDoseLevel,
  parseCarbLoadingInput,
  type BigMealTolerance,
  type Diabetes,
  type DoseLevel,
  type EatingDisorderHistory,
  type GiHistory,
  type RaceCarbs,
  type Sex,
  type Sport,
  type UsualDiet,
} from "../core";
import type { FieldError } from "./fields";

export type StepId = "race" | "athlete" | "gutDiet" | "prep" | "health";
export type YesNo = "" | "yes" | "no";

export interface HoursMinutes {
  h: string;
  m: string;
}

/** Everything the form holds. Numbers are strings so an empty field stays empty. Never persisted. */
export interface FormState {
  sport: "" | Sport;
  raceDate: string;
  startTime: string;
  duration: HoursMinutes;
  daysSinceLastRace: string;
  weightKg: string;
  age: string;
  sex: "" | Sex;
  giHistory: "" | GiHistory;
  ibsDiagnosed: YesNo;
  coeliac: YesNo;
  lactoseIntolerance: YesNo;
  usualDiet: UsualDiet;
  loadingDays: string;
  doseLevel: DoseLevel;
  lastHardSessionDate: string;
  noRecentHardSession: boolean;
  raceCarbs: "" | RaceCarbs;
  preMealHours: string;
  bigMealTolerance: BigMealTolerance;
  diabetes: "" | Diabetes;
  pregnant: YesNo;
  eatingDisorderHistory: "" | EatingDisorderHistory;
  redsOrLowEnergyDiagnosis: YesNo;
  amenorrhea3Months: YesNo;
}

export function initialFormState(): FormState {
  return {
    sport: "",
    raceDate: "",
    startTime: "",
    duration: { h: "", m: "" },
    daysSinceLastRace: "",
    weightKg: "",
    age: "",
    sex: "",
    giHistory: "",
    ibsDiagnosed: "",
    coeliac: "",
    lactoseIntolerance: "",
    usualDiet: "mixed",
    loadingDays: String(T.loadingDays.value.default),
    doseLevel: defaultDoseLevel(),
    lastHardSessionDate: "",
    noRecentHardSession: false,
    raceCarbs: "",
    preMealHours: "",
    bigMealTolerance: "normal",
    diabetes: "",
    pregnant: "",
    eatingDisorderHistory: "",
    redsOrLowEnergyDiagnosis: "",
    amenorrhea3Months: "",
  };
}

/** Applies a patch. Changing the gut history puts the dose back to its default. */
export function applyPatch(form: FormState, patch: Partial<FormState>): FormState {
  const next = { ...form, ...patch };
  if ("giHistory" in patch) next.doseLevel = defaultDoseLevel();
  return next;
}

const toNum = (s: string): number | undefined => {
  const trimmed = s.trim().replace(",", ".");
  return trimmed === "" ? undefined : Number(trimmed);
};
const toYesNo = (v: YesNo): boolean | undefined => (v === "" ? undefined : v === "yes");

export function hmToMinutes(hm: HoursMinutes): number | undefined {
  const h = toNum(hm.h);
  const m = toNum(hm.m);
  if (h === undefined && m === undefined) return undefined;
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Steps shown for this form: "prep" only when the race is longer than the pre-meal threshold. */
export function visibleSteps(form: FormState): StepId[] {
  const duration = hmToMinutes(form.duration);
  const prep = duration !== undefined && Number.isFinite(duration) && duration > T.preMealAboveMin.value;
  return prep ? ["race", "athlete", "gutDiet", "prep", "health"] : ["race", "athlete", "gutDiet", "health"];
}

/** Raw input for `parseCarbLoadingInput`. Empty fields stay undefined so they are reported as required. */
export function toRaw(f: FormState): Record<string, unknown> {
  return {
    sport: f.sport,
    raceDate: f.raceDate,
    startTime: f.startTime,
    durationMin: hmToMinutes(f.duration),
    daysSinceLastRace: toNum(f.daysSinceLastRace),
    weightKg: toNum(f.weightKg),
    age: toNum(f.age),
    sex: f.sex,
    giHistory: f.giHistory,
    ibsDiagnosed: toYesNo(f.ibsDiagnosed),
    coeliac: toYesNo(f.coeliac),
    lactoseIntolerance: toYesNo(f.lactoseIntolerance),
    usualDiet: f.usualDiet,
    loadingDays: toNum(f.loadingDays),
    doseLevel: f.doseLevel,
    lastHardSession: f.noRecentHardSession ? { kind: "none_recent" } : { kind: "date", date: f.lastHardSessionDate },
    raceCarbs: f.raceCarbs,
    preMealHours: toNum(f.preMealHours),
    bigMealTolerance: f.bigMealTolerance,
    diabetes: f.diabetes,
    pregnant: toYesNo(f.pregnant),
    eatingDisorderHistory: f.eatingDisorderHistory,
    redsOrLowEnergyDiagnosis: toYesNo(f.redsOrLowEnergyDiagnosis),
    amenorrhea3Months: toYesNo(f.amenorrhea3Months),
  };
}

export type FieldErrors = Record<string, FieldError>;

/** Input fields each step is responsible for. */
export const STEP_FIELDS: Record<StepId, string[]> = {
  race: ["sport", "raceDate", "startTime", "durationMin", "daysSinceLastRace"],
  athlete: ["weightKg", "age", "sex"],
  gutDiet: ["giHistory", "ibsDiagnosed", "coeliac", "lactoseIntolerance", "usualDiet"],
  prep: ["loadingDays", "doseLevel", "lastHardSession", "raceCarbs", "preMealHours", "bigMealTolerance"],
  health: ["diabetes", "pregnant", "eatingDisorderHistory", "redsOrLowEnergyDiagnosis", "amenorrhea3Months"],
};

/** Errors for the fields of one step, from the engine's own validation. */
export function validateStep(form: FormState, step: StepId, today: string): FieldErrors {
  const result = parseCarbLoadingInput(toRaw(form), today);
  const errors: FieldErrors = {};
  if (result.ok) return errors;
  const fields = STEP_FIELDS[step];
  for (const e of result.errors) {
    if (fields.includes(e.field) && !errors[e.field]) errors[e.field] = { type: e.type, min: e.min, max: e.max };
  }
  return errors;
}

/** Local date of the browser as YYYY-MM-DD. */
export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
