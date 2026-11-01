// Step 6 — modifiers and non-blocking warnings. They never change the numbers.
import { THRESHOLDS as T } from "../data/thresholds";
import type { CarbLoadingInput, Eligibility, RawWarning } from "../types";

export function collectModifiers(input: CarbLoadingInput, eligibility: Eligibility): RawWarning[] {
  const out: RawWarning[] = [];
  const loading = eligibility === "loading";
  const hasFoods = eligibility !== "none";

  if (loading) {
    if (input.sport !== "cycling") out.push({ code: "SPORT_WEAK_EVIDENCE", trigger: { field: "sport", value: input.sport } });
    const days = input.daysSinceLastRace;
    if (days !== "none") {
      if (days <= T.backToBack.value.noRepeatMaxDays) {
        out.push({ code: "BACK_TO_BACK_48H", trigger: { field: "daysSinceLastRace", value: days } });
      } else if (days === T.backToBack.value.uncertainDays) {
        out.push({ code: "BACK_TO_BACK_UNCERTAIN", trigger: { field: "daysSinceLastRace", value: days }, params: { days } });
      }
    }
    if (input.durationMin > T.ultraAboveMin.value) out.push({ code: "ULTRA", trigger: { field: "durationMin", value: input.durationMin } });
  }

  if (hasFoods) {
    if (input.coeliac) out.push({ code: "FILTER_GLUTEN", trigger: { field: "coeliac", value: input.coeliac } });
    if (input.lactoseIntolerance) {
      out.push({ code: "FILTER_LACTOSE", trigger: { field: "lactoseIntolerance", value: input.lactoseIntolerance } });
    }
    if (input.giHistory === "frequent") out.push({ code: "FILTER_GI", trigger: { field: "giHistory", value: input.giHistory } });
  }

  if (input.ibsDiagnosed) out.push({ code: "IBS", trigger: { field: "ibsDiagnosed", value: input.ibsDiagnosed } });
  if (input.usualDiet === "lchf_keto") out.push({ code: "LCHF", trigger: { field: "usualDiet", value: input.usualDiet } });
  if (input.age >= T.limitedDataFromAge.value) out.push({ code: "AGE_LIMITED_DATA", trigger: { field: "age", value: input.age } });
  if (input.eatingDisorderHistory === "prefer_not_to_say") {
    out.push({ code: "REDS_SUPPORT", trigger: { field: "eatingDisorderHistory", value: input.eatingDisorderHistory } });
  }
  if (input.redsOrLowEnergyDiagnosis) {
    out.push({ code: "REDS_DOCTOR", trigger: { field: "redsOrLowEnergyDiagnosis", value: input.redsOrLowEnergyDiagnosis } });
  } else if (input.amenorrhea3Months) {
    out.push({ code: "REDS_DOCTOR", trigger: { field: "amenorrhea3Months", value: input.amenorrhea3Months } });
  }
  return out;
}
