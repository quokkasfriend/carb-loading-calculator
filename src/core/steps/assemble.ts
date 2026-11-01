// Step 8 — assembly and rounding. Nothing is rounded before this point.
import { THRESHOLDS as T } from "../data/thresholds";
import { roundInt, roundTo } from "../rounding";
import type { LoadingDay, PreRaceMeal } from "../types";
import type { Calendar } from "./calendar";
import type { RawPreRaceMeal } from "./prerace";

export const blocksOf = (carbsG: number): number => roundInt(carbsG / T.blockG.value);

export function assembleDays(calendar: Calendar, carbsG: number, weightKg: number): LoadingDay[] {
  const k = T.kcal.value;
  const kcal = roundTo(
    k.perGCarb * carbsG + k.perGProtein * (k.proteinGPerKg * weightKg) + k.perGFat * (k.fatGPerKg * weightKg),
    T.kcalStep.value,
  );
  const recharge = {
    share: T.recharge.value.share,
    windowH: T.recharge.value.windowH,
    carbsG: roundTo(T.recharge.value.share * carbsG, T.carbsStepG.value),
  };
  return calendar.days.map((d) => ({
    offset: d.offset,
    date: d.date,
    carbsG,
    blocks: blocksOf(carbsG),
    kcal,
    fibre: calendar.fibre,
    training: { maxMin: d.trainingMaxMin, intensity: "easy" },
    recharge,
  }));
}

export function assemblePreRace(meal: RawPreRaceMeal, weightKg: number): PreRaceMeal {
  const step = T.carbsStepG.value;
  return {
    time: meal.time,
    dayOffset: meal.dayOffset,
    hoursBefore: meal.hoursBefore,
    gPerKgMin: meal.gPerKgMin,
    gPerKgMax: meal.gPerKgMax,
    gMin: roundTo(meal.gPerKgMin * weightKg, step),
    gMax: roundTo(meal.gPerKgMax * weightKg, step),
    fructoseSuggested: true,
    usualMealsBefore: meal.usualMealsBefore,
  };
}

export const roundedCarbs = (rawCarbsG: number): number => roundTo(rawCarbsG, T.carbsStepG.value);
export const minHighGiBlocks = (blocks: number): number => Math.ceil(blocks * T.oneDayHighGiMinShare.value);
export const weightGainOf = () => ({ ...T.weightGainPct.value });
