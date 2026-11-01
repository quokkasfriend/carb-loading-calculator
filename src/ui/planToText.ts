import { THRESHOLDS as T } from "../core";
import type { CarbLoadingPlan } from "../core";
import {
  dayCarbs,
  dayFibre,
  dayKcal,
  dayRecharge,
  dayTitle,
  dayTraining,
  choText,
  fibreText,
  portionText,
  preRaceText,
  warningText,
  type FormatDate,
  type Translate,
} from "./view";

/** The plan as plain text, one line per item, in the same sections as the result. A blocked plan has no numbers. */
export function planToText(plan: CarbLoadingPlan, t: Translate, formatDate: FormatDate, locale: string): string {
  const lines: string[] = [t("result.heading"), t(`result.answer.${plan.loading}`)];

  if (plan.loading === "blocked") {
    for (const w of plan.warnings) lines.push(warningText(w, t, formatDate));
    return lines.join("\n");
  }

  const reasonValues = { loadingAboveMin: T.loadingAboveMin.value, noTargetBelowMin: T.noTargetBelowMin.value };
  lines.push(t(`reasons.${plan.reason}`, reasonValues));
  const warningLines = (severity: "warning" | "info") =>
    plan.warnings.filter((w) => w.severity === severity).map((w) => `- ${warningText(w, t, formatDate)}`);
  lines.push(...warningLines("warning"));

  if (plan.loading === "yes") {
    lines.push("", t("result.blocksExplainer", { blockG: T.blockG.value }));
    for (const d of plan.days) {
      lines.push("", dayTitle(d, t, formatDate), dayCarbs(d.carbsG, d.blocks, t), dayKcal(d.kcal, t), dayFibre(d, t), dayTraining(d, t), dayRecharge(d, t));
    }
    lines.push("", t("result.hardSessionLatest", { date: formatDate(plan.hardSessionLatest) }));
    const blocks = plan.days[0].blocks;
    lines.push(
      plan.carbType.kind === "mixed"
        ? t("result.carbType.mixed")
        : t("result.carbType.high_gi_half", { minHighGiBlocks: plan.carbType.minHighGiBlocks, blocks }),
    );
    lines.push(t("result.occasions", plan.occasionsPerDay));
  } else if (plan.eligibility === "fuel_up") {
    const d = plan.fuelUpDay;
    lines.push(
      "",
      t("result.blocksExplainer", { blockG: T.blockG.value }),
      t("result.fuelUp", { date: formatDate(d.date), carbsG: d.carbsG, blocks: d.blocks, blockG: T.blockG.value, gPerKg: d.gPerKg }),
    );
  }

  if ("preRace" in plan && plan.preRace) {
    lines.push("", preRaceText(plan.preRace, t), t("result.preRace.composition"));
    if (plan.preRace.usualMealsBefore) lines.push(t("result.preRace.usualMealsBefore"));
    lines.push(t("result.preRace.notCounted"));
  }

  if (plan.loading === "yes") {
    lines.push("", t(`expectation.${plan.expectation}`), t("result.weight", plan.weightGainPct));
  }

  if ("foods" in plan) {
    lines.push("", t("result.foods.heading", { blockG: T.blockG.value }));
    for (const f of plan.foods) lines.push(`- ${t(`foods.${f.id}.name`)}: ${portionText(f, locale)} (${choText(f, t, locale)}), ${t("result.foods.cols.fibre")} ${fibreText(f, t, locale)}`);
    lines.push(t("result.foods.labelSource"));
  }

  const info = warningLines("info");
  if (info.length > 0) lines.push("", ...info);
  return lines.join("\n");
}
