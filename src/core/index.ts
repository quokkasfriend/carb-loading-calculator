import { WARNING_ORDER, WARNING_REGISTRY } from "./data/warnings";
import { THRESHOLDS as T } from "./data/thresholds";
import { assembleDays, assemblePreRace, blocksOf, minHighGiBlocks, roundedCarbs, weightGainOf } from "./steps/assemble";
import { buildCalendar } from "./steps/calendar";
import { computeDose } from "./steps/dose";
import { REASON, eligibilityOf } from "./steps/eligibility";
import { expectationOf } from "./steps/expectation";
import { foodExamples } from "./steps/foods";
import { collectModifiers } from "./steps/modifiers";
import { computePreRaceMeal } from "./steps/prerace";
import { blockCodes, safetyBlocks } from "./steps/safety";
import type { CarbLoadingInput, CarbLoadingPlan, RawWarning, Warning } from "./types";
import { addDays } from "./dates";

export { parseCarbLoadingInput } from "./validate";
export { defaultDoseLevel, isHighDoseAllowed } from "./steps/dose";
export { THRESHOLDS } from "./data/thresholds";
export type * from "./types";

/** Adds severity, source and confidence from the registry, in registry order. */
function resolveWarnings(raw: RawWarning[]): Warning[] {
  return raw
    .map((w) => {
      const meta = WARNING_REGISTRY[w.code];
      const warning: Warning = {
        code: w.code,
        severity: meta.severity,
        trigger: w.trigger,
        source: meta.source,
        confidence: meta.confidence,
      };
      if (w.params) warning.params = w.params;
      return warning;
    })
    .sort((a, b) => WARNING_ORDER.indexOf(a.code) - WARNING_ORDER.indexOf(b.code));
}

/** Pure and deterministic: the same input always gives the same plan. Returns codes and numbers, never texts. */
export function buildCarbLoadingPlan(input: CarbLoadingInput): CarbLoadingPlan {
  // Step 1
  const blocks = safetyBlocks(input);
  if (blocks.length > 0) return { loading: "blocked", reasons: blockCodes(blocks), warnings: resolveWarnings(blocks) };

  // Steps 2, 3
  const eligibility = eligibilityOf(input.durationMin);
  const dose = computeDose(eligibility, input);
  const warnings: RawWarning[] = [...(dose?.warnings ?? [])];

  if (eligibility === "none") {
    warnings.push(...collectModifiers(input, eligibility));
    return { loading: "no", eligibility, reason: REASON.none as "UNDER_60", warnings: resolveWarnings(warnings) };
  }
  if (dose === undefined) throw new Error("dose missing");

  const carbsG = roundedCarbs(dose.rawCarbsG);
  const meal = computePreRaceMeal(input);
  const preRace = meal === undefined ? undefined : assemblePreRace(meal, input.weightKg);
  const foods = foodExamples(input);

  if (eligibility === "fuel_up") {
    warnings.push(...collectModifiers(input, eligibility));
    return {
      loading: "no",
      eligibility,
      reason: "FUEL_UP_60_90",
      fuelUpDay: { offset: 1, date: addDays(input.raceDate, -1), gPerKg: dose.gPerKg, carbsG, blocks: blocksOf(carbsG) },
      ...(preRace ? { preRace } : {}),
      foods,
      warnings: resolveWarnings(warnings),
    };
  }

  // Steps 4–7 (loading)
  const calendar = buildCalendar(input);
  if (preRace === undefined || dose.level === undefined || dose.highAllowed === undefined || input.raceCarbs === undefined) {
    throw new Error("loading input is incomplete");
  }
  warnings.push(...calendar.warnings, ...collectModifiers(input, eligibility));
  const blocksPerDay = blocksOf(carbsG);

  return {
    loading: "yes",
    eligibility,
    reason: "LOADING_OVER_90",
    dose: { level: dose.level, gPerKg: dose.gPerKg, highAllowed: dose.highAllowed },
    requestedDays: calendar.requestedDays,
    days: assembleDays(calendar, carbsG, input.weightKg),
    hardSessionLatest: calendar.hardSessionLatest,
    carbType:
      calendar.carbType === "mixed" ? { kind: "mixed" } : { kind: "high_gi_half", minHighGiBlocks: minHighGiBlocks(blocksPerDay) },
    occasionsPerDay: { ...T.occasionsPerDay.value },
    preRace,
    expectation: expectationOf(input.raceCarbs),
    weightGainPct: weightGainOf(),
    foods,
    warnings: resolveWarnings(warnings),
  };
}
