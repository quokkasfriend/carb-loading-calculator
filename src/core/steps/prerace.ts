// Step 5 — pre-race meal. Amounts are not rounded yet.
import { THRESHOLDS as T } from "../data/thresholds";
import { parseTime, subtractHours } from "../dates";
import type { CarbLoadingInput, PreMealHours } from "../types";

export interface RawPreRaceMeal {
  time: string;
  dayOffset: 0 | -1;
  hoursBefore: PreMealHours;
  gPerKgMin: number;
  gPerKgMax: number;
  usualMealsBefore: boolean;
}

export function computePreRaceMeal(
  input: Pick<CarbLoadingInput, "durationMin" | "preMealHours" | "bigMealTolerance" | "startTime">,
): RawPreRaceMeal | undefined {
  if (input.durationMin <= T.preMealAboveMin.value) return undefined;
  const hours = input.preMealHours;
  if (hours === undefined) throw new Error("pre-race meal input is incomplete");
  const dose = T.preMealDose.value;

  const gPerKgMin = hours === 1 ? dose.oneHourGPerKg : dose.standardGPerKg;
  // "low" tolerance counts as "normal".
  const gPerKgMax =
    input.bigMealTolerance === "high" && hours >= T.preMealHighTolerance.value.minHours ? Math.min(hours, dose.maxGPerKg) : gPerKgMin;

  const { time, dayOffset } = subtractHours(input.startTime, hours);
  const start = parseTime(input.startTime) as number;
  const afternoon = parseTime(T.afternoonFrom.value) as number;
  return { time, dayOffset, hoursBefore: hours, gPerKgMin, gPerKgMax, usualMealsBefore: start >= afternoon };
}
