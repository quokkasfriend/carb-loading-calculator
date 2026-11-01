// Food examples: portion for one block, with the dietary filters.
import { FOODS } from "../data/foods";
import { THRESHOLDS as T } from "../data/thresholds";
import { round1, roundInt } from "../rounding";
import type { CarbLoadingInput, FoodEntry, FoodExample, FoodGroup } from "../types";

const GROUP_ORDER: readonly FoodGroup[] = ["base", "low_residue", "other"];
const PERCENT = 100;

export function foodExamples(
  input: Pick<CarbLoadingInput, "coeliac" | "lactoseIntolerance" | "giHistory">,
): FoodExample[] {
  const sensitiveGut = input.giHistory === "frequent";
  const allowed = FOODS.filter((f) => {
    if (input.coeliac && (f.gluten === "yes" || f.gluten === "often")) return false;
    if (input.lactoseIntolerance && f.lactose === "yes") return false;
    if (sensitiveGut && f.limitForGi) return false;
    return true;
  });
  const ordered = GROUP_ORDER.flatMap((group) => allowed.filter((f) => f.group === group));
  return ordered.map((f) => toExample(f, input));
}

function toExample(f: FoodEntry, input: Pick<CarbLoadingInput, "coeliac" | "lactoseIntolerance">): FoodExample {
  const portion = roundInt(T.blockG.value / (f.cho100 / PERCENT));
  const fibreIn = (per100: number) => round1((portion * per100) / PERCENT);
  let fibrePortion: FoodExample["fibrePortion"] = null;
  if (typeof f.fibre100 === "number") fibrePortion = fibreIn(f.fibre100);
  else if (f.fibre100 !== null) fibrePortion = { min: fibreIn(f.fibre100.min), max: fibreIn(f.fibre100.max) };
  return {
    id: f.id,
    unit: f.unit,
    portion,
    cho100: f.cho100,
    fibrePortion,
    gi: f.gi,
    group: f.group,
    fructose: f.fructose,
    checkLabel: (input.coeliac && f.gluten === "check_label") || (input.lactoseIntolerance && f.lactose === "check_label"),
    labelSource: f.source === "label",
    hasNote: f.hasNote === true,
  };
}
