// Types of the carb loading engine.

export type Confidence = "high" | "medium" | "low" | "heuristic";

export interface Sourced<T> {
  value: T;
  /** Where the value comes from: the author and year of a study, or "product decision". */
  source: string;
  confidence: Confidence;
  note?: string;
}

// --- Input ------------------------------------------------------------------------------------------------------

export type Sex = "female" | "male" | "other";
export type Sport = "cycling" | "road_running" | "trail" | "swimming" | "ocr" | "triathlon" | "other";
export type GiHistory = "none" | "occasional" | "frequent";
export type UsualDiet = "mixed" | "lchf_keto";
export type LoadingDaysOption = 1 | 2 | 3;
export type DoseLevel = "minimum" | "standard" | "high";
export type RaceCarbs = "zero" | "1_29" | "30_59" | "60_89" | "90_plus" | "dont_know";
export type PreMealHours = 1 | 2 | 3 | 4;
export type BigMealTolerance = "low" | "normal" | "high";
export type Diabetes = "no" | "type_1" | "type_2" | "other";
export type EatingDisorderHistory = "no" | "yes" | "prefer_not_to_say";
export type LastHardSession = { kind: "date"; date: string } | { kind: "none_recent" };

/** Validated input. Fields that depend on the race duration are optional here and always present when needed. */
export interface CarbLoadingInput {
  /** YYYY-MM-DD, local date of the browser. */
  today: string;
  weightKg: number;
  age: number;
  sex: Sex;
  sport: Sport;
  durationMin: number;
  /** YYYY-MM-DD */
  raceDate: string;
  /** HH:MM */
  startTime: string;
  daysSinceLastRace: number | "none";
  giHistory: GiHistory;
  ibsDiagnosed: boolean;
  coeliac: boolean;
  lactoseIntolerance: boolean;
  usualDiet: UsualDiet;
  /** Only when durationMin > loadingAboveMin. */
  loadingDays?: LoadingDaysOption;
  doseLevel?: DoseLevel;
  lastHardSession?: LastHardSession;
  raceCarbs?: RaceCarbs;
  /** Only when durationMin > preMealAboveMin. */
  preMealHours?: PreMealHours;
  bigMealTolerance?: BigMealTolerance;
  diabetes: Diabetes;
  pregnant: boolean;
  eatingDisorderHistory: EatingDisorderHistory;
  redsOrLowEnergyDiagnosis: boolean;
  amenorrhea3Months: boolean;
}

export type InputErrorType =
  | "required"
  | "range"
  | "invalid"
  | "raceTooSoon"
  | "raceTooFar"
  | "sessionAfterRace"
  | "sessionTooOld";

export interface InputError {
  field: string;
  type: InputErrorType;
  min?: number;
  max?: number;
}

export type ParseResult = { ok: true; input: CarbLoadingInput } | { ok: false; errors: InputError[] };

// --- Codes ------------------------------------------------------------------------------------------------------

export type BlockCode = "BLOCK_DIABETES" | "BLOCK_MINOR" | "BLOCK_PREGNANCY" | "BLOCK_EATING_DISORDER";

export type WarningCode =
  | "HIGH_DOSE_UNAVAILABLE"
  | "SESSION_TOO_CLOSE"
  | "DAYS_REDUCED_SESSION"
  | "DAYS_REDUCED_DATE"
  | "IBS"
  | "SPORT_WEAK_EVIDENCE"
  | "BACK_TO_BACK_48H"
  | "BACK_TO_BACK_UNCERTAIN"
  | "ULTRA"
  | "LCHF"
  | "FILTER_GLUTEN"
  | "FILTER_LACTOSE"
  | "FILTER_GI"
  | "AGE_LIMITED_DATA"
  | "REDS_SUPPORT"
  | "REDS_DOCTOR";

export type EligibilityReason = "UNDER_60" | "FUEL_UP_60_90" | "LOADING_OVER_90";
export type Eligibility = "none" | "fuel_up" | "loading";
export type ExpectationCode = "NO_RACE_CARBS" | "PLAUSIBLE" | "DOUBLE_BLIND_NO_BENEFIT";

// --- Output -----------------------------------------------------------------------------------------------------

export type Severity = "block" | "warning" | "info";

export interface Warning {
  code: WarningCode | BlockCode;
  severity: Severity;
  trigger: { field: keyof CarbLoadingInput; value: unknown };
  params?: Record<string, string | number>;
  source: string;
  confidence: Confidence;
}

/** What a step emits: the engine adds severity, source and confidence from the registry. */
export interface RawWarning {
  code: WarningCode | BlockCode;
  trigger: { field: keyof CarbLoadingInput; value: unknown };
  params?: Record<string, string | number>;
}

export interface LoadingDay {
  /** D−offset */
  offset: 1 | 2 | 3;
  date: string;
  carbsG: number;
  blocks: number;
  kcal: number;
  fibre: "usual" | "under_10g";
  training: { maxMin: number; intensity: "easy" };
  recharge: { share: number; windowH: number; carbsG: number };
}

export interface PreRaceMeal {
  time: string;
  dayOffset: 0 | -1;
  hoursBefore: PreMealHours;
  gPerKgMin: number;
  gPerKgMax: number;
  gMin: number;
  gMax: number;
  fructoseSuggested: true;
  usualMealsBefore: boolean;
}

export type FoodGroup = "base" | "low_residue" | "other";
type FoodGi = "low_medium" | "medium" | "medium_high" | "high";

export interface FoodExample {
  id: string;
  unit: "g" | "ml";
  /** Portion for one block, in `unit`. */
  portion: number;
  /** Carbohydrates in g per 100 g (or 100 ml) of the food. */
  cho100: number;
  /** Fibre in the portion, in g. A range, or null when unknown ("<1 g"). */
  fibrePortion: number | { min: number; max: number } | null;
  gi: FoodGi;
  group: FoodGroup;
  fructose: boolean;
  checkLabel: boolean;
  labelSource: boolean;
  hasNote: boolean;
}

export type CarbLoadingPlan =
  | { loading: "blocked"; reasons: BlockCode[]; warnings: Warning[] }
  | { loading: "no"; eligibility: "none"; reason: "UNDER_60"; warnings: Warning[] }
  | {
      loading: "no";
      eligibility: "fuel_up";
      reason: "FUEL_UP_60_90";
      fuelUpDay: { offset: 1; date: string; gPerKg: number; carbsG: number; blocks: number };
      preRace?: PreRaceMeal;
      foods: FoodExample[];
      warnings: Warning[];
    }
  | {
      loading: "yes";
      eligibility: "loading";
      reason: "LOADING_OVER_90";
      dose: { level: DoseLevel; gPerKg: number; highAllowed: boolean };
      requestedDays: LoadingDaysOption;
      days: LoadingDay[];
      hardSessionLatest: string;
      carbType: { kind: "mixed" } | { kind: "high_gi_half"; minHighGiBlocks: number };
      occasionsPerDay: { min: number; max: number };
      preRace: PreRaceMeal;
      expectation: ExpectationCode;
      weightGainPct: { min: number; max: number };
      foods: FoodExample[];
      warnings: Warning[];
    };

// --- Food table -------------------------------------------------------------------------------------------------

type GlutenFlag = "yes" | "no" | "often" | "check_label";
type LactoseFlag = "yes" | "no" | "check_label";

export interface FoodEntry {
  id: string;
  cho100: number;
  fibre100: number | { min: number; max: number } | null;
  unit: "g" | "ml";
  gi: FoodGi;
  gluten: GlutenFlag;
  lactose: LactoseFlag;
  group: FoodGroup;
  limitForGi: boolean;
  fructose: boolean;
  /** Where the nutrient values come from: INRAN, CREA (Italian food composition tables) or the product label. */
  source: string;
  confidence: Confidence;
  note?: string;
  /** True when `foods.<id>.note` exists in the messages. */
  hasNote?: boolean;
}

export interface WarningMeta {
  severity: Severity;
  source: string;
  confidence: Confidence;
  note?: string;
}
