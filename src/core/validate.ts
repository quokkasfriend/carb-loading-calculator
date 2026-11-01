import { THRESHOLDS as T } from "./data/thresholds";
import { addDays, gap, isValidTime, parseDate } from "./dates";
import type {
  BigMealTolerance,
  CarbLoadingInput,
  Diabetes,
  DoseLevel,
  EatingDisorderHistory,
  GiHistory,
  InputError,
  InputErrorType,
  LastHardSession,
  LoadingDaysOption,
  ParseResult,
  PreMealHours,
  RaceCarbs,
  Sex,
  Sport,
  UsualDiet,
} from "./types";

const SEXES: readonly Sex[] = ["female", "male", "other"];
const SPORTS: readonly Sport[] = ["cycling", "road_running", "trail", "swimming", "ocr", "triathlon", "other"];
const GI_HISTORIES: readonly GiHistory[] = ["none", "occasional", "frequent"];
const DIETS: readonly UsualDiet[] = ["mixed", "lchf_keto"];
const DOSE_LEVELS: readonly DoseLevel[] = ["minimum", "standard", "high"];
const RACE_CARBS: readonly RaceCarbs[] = ["zero", "1_29", "30_59", "60_89", "90_plus", "dont_know"];
const TOLERANCES: readonly BigMealTolerance[] = ["low", "normal", "high"];
const DIABETES: readonly Diabetes[] = ["no", "type_1", "type_2", "other"];
const EATING_DISORDER: readonly EatingDisorderHistory[] = ["no", "yes", "prefer_not_to_say"];

const isMissing = (v: unknown): boolean => v === undefined || v === null || v === "";

/** Reads fields of the raw input and collects every error. */
class Reader {
  readonly errors: InputError[] = [];
  constructor(private readonly raw: Record<string, unknown>) {}

  get(field: string): unknown {
    return this.raw[field];
  }

  fail(field: string, type: InputErrorType, extra: { min?: number; max?: number } = {}): undefined {
    this.errors.push({ field, type, ...extra });
    return undefined;
  }

  number(field: string, range: { min: number; max: number }, integer: boolean): number | undefined {
    const v = this.raw[field];
    if (isMissing(v)) return this.fail(field, "required");
    if (typeof v !== "number" || !Number.isFinite(v) || (integer && !Number.isInteger(v))) return this.fail(field, "invalid");
    if (v < range.min || v > range.max) return this.fail(field, "range", range);
    return v;
  }

  oneOf<V extends string | number>(field: string, allowed: readonly V[], fallback?: V): V | undefined {
    const v = this.raw[field];
    if (isMissing(v)) return fallback === undefined ? this.fail(field, "required") : fallback;
    return (allowed as readonly unknown[]).includes(v) ? (v as V) : this.fail(field, "invalid");
  }

  /** Required boolean: must be present. */
  boolean(field: string): boolean | undefined {
    const v = this.raw[field];
    if (isMissing(v)) return this.fail(field, "required");
    return typeof v === "boolean" ? v : this.fail(field, "invalid");
  }

  /** Optional boolean with a default. */
  flag(field: string): boolean | undefined {
    const v = this.raw[field];
    if (isMissing(v)) return false;
    return typeof v === "boolean" ? v : this.fail(field, "invalid");
  }
}

/**
 * Validates the raw form input. Returns every error, not just the first. Conditional fields that are not needed
 * for the given race duration (and the women-only questions for male athletes) are dropped, not validated.
 */
export function parseCarbLoadingInput(raw: unknown, today: string): ParseResult {
  const r = new Reader(typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {});
  const todayDays = parseDate(today);
  if (todayDays === null) r.fail("today", "invalid");

  const weightKg = r.number("weightKg", T.weightKg.value, false);
  const age = r.number("age", T.age.value, true);
  const sex = r.oneOf("sex", SEXES);
  const sport = r.oneOf("sport", SPORTS);
  const durationMin = r.number("durationMin", T.durationMin.value, true);

  // Race date
  let raceDate: string | undefined;
  const rawRaceDate = r.get("raceDate");
  if (isMissing(rawRaceDate)) r.fail("raceDate", "required");
  else if (typeof rawRaceDate !== "string" || parseDate(rawRaceDate) === null) r.fail("raceDate", "invalid");
  else if (todayDays !== null) {
    const ahead = gap(today, rawRaceDate);
    if (ahead < T.raceDateAheadDays.value.min) r.fail("raceDate", "raceTooSoon");
    else if (ahead > T.raceDateAheadDays.value.max) r.fail("raceDate", "raceTooFar", { max: T.raceDateAheadDays.value.max });
    else raceDate = rawRaceDate;
  }

  // Start time
  let startTime: string | undefined;
  const rawStart = r.get("startTime");
  if (isMissing(rawStart)) r.fail("startTime", "required");
  else if (typeof rawStart !== "string" || !isValidTime(rawStart)) r.fail("startTime", "invalid");
  else startTime = rawStart;

  // Days since the last race: optional, "none" when absent.
  let daysSinceLastRace: number | "none" = "none";
  const rawDays = r.get("daysSinceLastRace");
  if (!isMissing(rawDays) && rawDays !== "none") {
    const n = r.number("daysSinceLastRace", T.daysSinceLastRace.value, true);
    if (n !== undefined) daysSinceLastRace = n;
  }

  const giHistory = r.oneOf("giHistory", GI_HISTORIES);
  const ibsDiagnosed = r.boolean("ibsDiagnosed");
  const coeliac = r.boolean("coeliac");
  const lactoseIntolerance = r.boolean("lactoseIntolerance");
  const usualDiet = r.oneOf("usualDiet", DIETS, "mixed");

  // Fields that depend on the duration.
  const loads = durationMin !== undefined && durationMin > T.loadingAboveMin.value;
  const hasMeal = durationMin !== undefined && durationMin > T.preMealAboveMin.value;

  let loadingDays: LoadingDaysOption | undefined;
  let doseLevel: DoseLevel | undefined;
  let lastHardSession: LastHardSession | undefined;
  let raceCarbs: RaceCarbs | undefined;
  if (loads) {
    loadingDays = r.oneOf("loadingDays", T.loadingDays.value.options, T.loadingDays.value.default);
    if (!isMissing(r.get("doseLevel"))) doseLevel = r.oneOf("doseLevel", DOSE_LEVELS);
    raceCarbs = r.oneOf("raceCarbs", RACE_CARBS);
    lastHardSession = parseSession(r, raceDate);
  }

  let preMealHours: PreMealHours | undefined;
  let bigMealTolerance: BigMealTolerance | undefined;
  if (hasMeal) {
    preMealHours = r.oneOf("preMealHours", T.preMealDose.value.hoursOptions);
    bigMealTolerance = r.oneOf("bigMealTolerance", TOLERANCES, "normal");
  }

  // Health
  const diabetes = r.oneOf("diabetes", DIABETES);
  const eatingDisorderHistory = r.oneOf("eatingDisorderHistory", EATING_DISORDER);
  const redsOrLowEnergyDiagnosis = r.boolean("redsOrLowEnergyDiagnosis");
  let pregnant: boolean | undefined = false;
  let amenorrhea3Months: boolean | undefined = false;
  if (sex !== "male") {
    pregnant = r.boolean("pregnant");
    amenorrhea3Months = r.boolean("amenorrhea3Months");
  }

  if (r.errors.length > 0) return { ok: false, errors: r.errors };

  const input = {
    today,
    weightKg,
    age,
    sex,
    sport,
    durationMin,
    raceDate,
    startTime,
    daysSinceLastRace,
    giHistory,
    ibsDiagnosed,
    coeliac,
    lactoseIntolerance,
    usualDiet,
    diabetes,
    pregnant,
    eatingDisorderHistory,
    redsOrLowEnergyDiagnosis,
    amenorrhea3Months,
  } as CarbLoadingInput;
  if (loads) {
    input.loadingDays = loadingDays;
    input.raceCarbs = raceCarbs;
    input.lastHardSession = lastHardSession;
    if (doseLevel !== undefined) input.doseLevel = doseLevel;
  }
  if (hasMeal) {
    input.preMealHours = preMealHours;
    input.bigMealTolerance = bigMealTolerance;
  }
  return { ok: true, input };
}

function parseSession(r: Reader, raceDate: string | undefined): LastHardSession | undefined {
  const v = r.get("lastHardSession");
  if (isMissing(v)) return r.fail("lastHardSession", "required");
  if (typeof v !== "object" || v === null) return r.fail("lastHardSession", "invalid");
  const kind = (v as { kind?: unknown }).kind;
  if (kind === "none_recent") return { kind: "none_recent" };
  if (kind !== "date") return r.fail("lastHardSession", "invalid");
  const date = (v as { date?: unknown }).date;
  if (isMissing(date)) return r.fail("lastHardSession", "required");
  if (typeof date !== "string" || parseDate(date) === null) return r.fail("lastHardSession", "invalid");
  // The range is relative to the race date: without a valid one, only the format can be checked.
  if (raceDate === undefined) return { kind: "date", date };
  const lookback = T.hardSessionLookbackDays.value;
  if (date >= raceDate) return r.fail("lastHardSession", "sessionAfterRace");
  if (date < addDays(raceDate, -lookback)) return r.fail("lastHardSession", "sessionTooOld", { max: lookback });
  return { kind: "date", date };
}
