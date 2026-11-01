// Turns plan data into sentences with the messages of `CarbLoading`. Shared by the result and the plain-text export,
// so the two always say the same thing.
import { THRESHOLDS as T } from "../core";
import type { FoodExample, LoadingDay, PreRaceMeal, Warning } from "../core";

export type Translate = (key: string, values?: Record<string, string | number>) => string;
/** "2026-11-14" → "Saturday 14 November" */
export type FormatDate = (isoDate: string) => string;

const PERCENT = 100;

export function warningText(w: Warning, t: Translate, formatDate: FormatDate): string {
  const group = w.severity === "block" ? "blocks" : "warnings";
  const params = { ...w.params };
  if (typeof params.sessionDate === "string") params.sessionDate = formatDate(params.sessionDate);
  return t(`${group}.${w.code}`, params);
}

/** The input field that raised the warning, as the label of its question. */
export function triggerText(w: Warning, t: Translate): string {
  const field = w.trigger.field === "durationMin" ? "duration" : w.trigger.field;
  return t("warnings.trigger", { label: t(`fields.${field}.label`) });
}

export const confidenceText = (w: Warning, t: Translate): string => t(`warnings.confidence.${w.confidence}`);

export const dayTitle = (d: LoadingDay, t: Translate, formatDate: FormatDate): string =>
  t("result.day.title", { offset: d.offset, date: formatDate(d.date) });

export const dayCarbs = (carbsG: number, blocks: number, t: Translate): string =>
  t("result.day.carbs", { carbsG, blocks, blockG: T.blockG.value });

export const dayKcal = (kcal: number, t: Translate): string => t("result.day.kcal", { kcal });

export const dayFibre = (d: LoadingDay, t: Translate): string => t(`result.day.fibre.${d.fibre}`, { lowFibreMaxG: T.lowFibreMaxG.value });

export const dayTraining = (d: LoadingDay, t: Translate): string => t("result.day.training", { maxMin: d.training.maxMin });

export const dayRecharge = (d: LoadingDay, t: Translate): string =>
  t("result.day.recharge", {
    windowH: d.recharge.windowH,
    sharePct: Math.round(d.recharge.share * PERCENT),
    carbsG: d.recharge.carbsG,
  });

export function preRaceText(meal: PreRaceMeal, t: Translate): string {
  const range = meal.gMin !== meal.gMax;
  const base = t(range ? "result.preRace.range" : "result.preRace.single", {
    gMin: meal.gMin,
    gMax: meal.gMax,
    time: meal.time,
    hours: meal.hoursBefore,
  });
  return meal.dayOffset === -1 ? `${base} ${t("result.preRace.previousDay")}` : base;
}

const number = (n: number, locale: string): string => n.toLocaleString(locale, { maximumFractionDigits: 1 });

export const portionText = (f: FoodExample, locale: string): string => `${number(f.portion, locale)} ${f.unit}`;

export const choText = (f: FoodExample, t: Translate, locale: string): string =>
  t("result.foods.cho100", { cho100: number(f.cho100, locale), unit: f.unit });

export function fibreText(f: FoodExample, t: Translate, locale: string): string {
  const p = f.fibrePortion;
  if (p === null) return t("result.foods.fibreUnknown");
  if (typeof p === "number") return `${number(p, locale)} g`;
  return `${number(p.min, locale)}–${number(p.max, locale)} g`;
}

export function foodBadges(f: FoodExample, t: Translate): string[] {
  const badges: string[] = [];
  if (f.gi === "high") badges.push(t("result.foods.badges.highGi"));
  if (f.fructose) badges.push(t("result.foods.badges.fructose"));
  if (f.checkLabel) badges.push(t("result.foods.badges.checkLabel"));
  return badges;
}

/** Warnings of one kind, in the order the engine emitted them. */
export const warningsOf = (warnings: Warning[], severity: Warning["severity"]): Warning[] => warnings.filter((w) => w.severity === severity);
