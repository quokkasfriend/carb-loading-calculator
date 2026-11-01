// Step 3 — dose.
import { THRESHOLDS as T } from "../data/thresholds";
import type { CarbLoadingInput, DoseLevel, Eligibility, GiHistory, RawWarning } from "../types";

export interface Dose {
  level?: DoseLevel;
  gPerKg: number;
  highAllowed?: boolean;
  /** Not rounded yet: rounding happens in step 8. */
  rawCarbsG: number;
  warnings: RawWarning[];
}

/** The high dose is available only without gut problems. */
export const isHighDoseAllowed = (giHistory: GiHistory): boolean => giHistory === "none";

/** Dose preselected by the UI and used when the user does not choose. */
export const defaultDoseLevel = (): DoseLevel => "standard";

export function computeDose(
  eligibility: Eligibility,
  input: Pick<CarbLoadingInput, "weightKg" | "doseLevel" | "giHistory">,
): Dose | undefined {
  if (eligibility === "none") return undefined;
  if (eligibility === "fuel_up") {
    const gPerKg = T.fuelUpGPerKg.value;
    return { gPerKg, rawCarbsG: gPerKg * input.weightKg, warnings: [] };
  }
  const highAllowed = isHighDoseAllowed(input.giHistory);
  const requested = input.doseLevel ?? defaultDoseLevel();
  const warnings: RawWarning[] = [];
  let level = requested;
  if (requested === "high" && !highAllowed) {
    level = "standard";
    warnings.push({
      code: "HIGH_DOSE_UNAVAILABLE",
      trigger: { field: "doseLevel", value: requested },
      params: { standard: T.doseGPerKg.value.standard },
    });
  }
  const gPerKg = T.doseGPerKg.value[level];
  return { level, gPerKg, highAllowed, rawCarbsG: gPerKg * input.weightKg, warnings };
}
