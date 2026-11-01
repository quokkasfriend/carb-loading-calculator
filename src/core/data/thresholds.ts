// Every number of the engine and of the UI lives here, with its source and how well it is supported.
// Confidence: "high" = consistent evidence, "medium" = some evidence, "low" = limited or weak evidence,
// "heuristic" = a rule of thumb or a product decision that is not backed by a study.
import type { Confidence, DoseLevel, ExpectationCode, LoadingDaysOption, PreMealHours, RaceCarbs, Sourced } from "../types";

const s = <T>(value: T, source: string, confidence: Confidence, note?: string): Sourced<T> =>
  note === undefined ? { value, source, confidence } : { value, source, confidence, note };

export const THRESHOLDS = {
  weightKg: s({ min: 35, max: 150 }, "general sports-nutrition research", "high"),
  age: s({ min: 10, max: 100 }, "product decision", "heuristic"),
  durationMin: s({ min: 10, max: 2880 }, "product decision", "heuristic"),
  daysSinceLastRace: s({ min: 0, max: 30 }, "product decision", "heuristic"),
  raceDateAheadDays: s({ min: 1, max: 365 }, "product decision", "heuristic"),
  hardSessionLookbackDays: s(14, "product decision", "heuristic"),
  minAge: s(18, "Jones 2026a", "low"),
  limitedDataFromAge: s(38, "Jones 2026a", "low"),
  noTargetBelowMin: s(60, "Thomas 2016", "high"),
  loadingAboveMin: s(90, "Thomas 2016; Burke 2011", "high"),
  preMealAboveMin: s(60, "Thomas 2016; Burke 2011", "high"),
  ultraAboveMin: s(240, "Jones 2026a", "low"),
  fuelUpGPerKg: s(7, "Thomas 2016", "heuristic"),
  doseGPerKg: s({ minimum: 8, standard: 10, high: 12 } satisfies Record<DoseLevel, number>, "Jones 2026b; Thomas 2016; Burke 2011", "high"),
  carbsStepG: s(10, "general sports-nutrition research", "high"),
  blockG: s(50, "general sports-nutrition research", "high"),
  kcalStep: s(10, "general sports-nutrition research", "high"),
  kcal: s({ perGCarb: 4, perGProtein: 4, perGFat: 9, proteinGPerKg: 2, fatGPerKg: 1 }, "Jones 2026b", "low"),
  loadingDays: s(
    { options: [1, 2, 3] as readonly LoadingDaysOption[], default: 2 as LoadingDaysOption, min: 1 },
    "Jones 2026b",
    "medium",
  ),
  trainingMaxMin: s({ lastDay: 30, otherDays: 60 }, "Jones 2026b", "medium"),
  recharge: s({ share: 0.4, windowH: 4 }, "Jones 2026b", "heuristic"),
  oneDayHighGiMinShare: s(0.5, "Burke 1993", "heuristic"),
  occasionsPerDay: s({ min: 5, max: 6 }, "Burke 1996", "heuristic"),
  lowFibreMaxG: s(10, "Foo 2022", "low"),
  preMealDose: s(
    {
      hoursOptions: [1, 2, 3, 4] as readonly PreMealHours[],
      oneHourGPerKg: 1,
      standardGPerKg: 2,
      maxGPerKg: 4,
    },
    "Thomas 2016; Burke 2011",
    "high",
  ),
  preMealHighTolerance: s({ minHours: 3 }, "Thomas 2016; Burke 2011", "heuristic"),
  afternoonFrom: s("12:00", "product decision", "heuristic"),
  backToBack: s({ noRepeatMaxDays: 2, uncertainDays: 3 }, "Doering 2019; McInerney 2005", "medium"),
  weightGainPct: s({ min: 0, max: 2 }, "Shiose 2016; Foo 2022", "low"),
  raceCarbsExpectation: s(
    {
      zero: "NO_RACE_CARBS",
      "1_29": "NO_RACE_CARBS",
      "30_59": "PLAUSIBLE",
      dont_know: "PLAUSIBLE",
      "60_89": "DOUBLE_BLIND_NO_BENEFIT",
      "90_plus": "DOUBLE_BLIND_NO_BENEFIT",
    } satisfies Record<RaceCarbs, ExpectationCode>,
    "Burke 2000; Jones 2026c; Jones 2025",
    "heuristic",
  ),
} as const;

