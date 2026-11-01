// Step 2 — eligibility: no target, fuel-up or loading, by race duration.
import { THRESHOLDS as T } from "../data/thresholds";
import type { Eligibility, EligibilityReason } from "../types";

export function eligibilityOf(durationMin: number): Eligibility {
  if (durationMin < T.noTargetBelowMin.value) return "none";
  if (durationMin <= T.loadingAboveMin.value) return "fuel_up";
  return "loading";
}

export const REASON: Record<Eligibility, EligibilityReason> = {
  none: "UNDER_60",
  fuel_up: "FUEL_UP_60_90",
  loading: "LOADING_OVER_90",
};
