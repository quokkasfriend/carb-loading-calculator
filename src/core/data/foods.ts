// Food table values per 100 g (or 100 ml), INRAN/CREA tables or product label.
import type { Confidence, FoodEntry } from "../types";

const nutrientConfidence = (source: string): Confidence => {
  if (source === "INRAN" || source === "CREA") return "high";
  return source === "label" ? "medium" : "heuristic";
};

type Row = Omit<FoodEntry, "confidence"> & { confidence?: Confidence };

const rows: Row[] = [
  { id: "pasta", cho100: 79.1, fibre100: 2.7, unit: "g", gi: "low_medium", gluten: "yes", lactose: "no", group: "base", limitForGi: false, fructose: false, source: "INRAN" },
  { id: "rice", cho100: 80.4, fibre100: 1.0, unit: "g", gi: "high", gluten: "no", lactose: "no", group: "base", limitForGi: false, fructose: false, source: "INRAN" },
  { id: "bread", cho100: 63.5, fibre100: 3.8, unit: "g", gi: "high", gluten: "yes", lactose: "no", group: "base", limitForGi: false, fructose: false, source: "INRAN" },
  { id: "rusks", cho100: 82.3, fibre100: 3.5, unit: "g", gi: "medium_high", gluten: "yes", lactose: "no", group: "other", limitForGi: false, fructose: false, source: "INRAN", hasNote: true },
  { id: "cornflakes", cho100: 87.4, fibre100: 3.8, unit: "g", gi: "high", gluten: "often", lactose: "no", group: "other", limitForGi: false, fructose: false, source: "INRAN", hasNote: true },
  { id: "rice_cakes", cho100: 80, fibre100: { min: 1.3, max: 5.2 }, unit: "g", gi: "high", gluten: "check_label", lactose: "no", group: "other", limitForGi: false, fructose: false, source: "label" },
  { id: "potatoes", cho100: 17.9, fibre100: 1.6, unit: "g", gi: "high", gluten: "no", lactose: "no", group: "base", limitForGi: false, fructose: false, source: "INRAN" },
  { id: "dry_biscuits", cho100: 84.8, fibre100: 2.6, unit: "g", gi: "medium", gluten: "yes", lactose: "check_label", group: "other", limitForGi: false, fructose: false, source: "INRAN" },
  { id: "honey", cho100: 80.3, fibre100: 0, unit: "g", gi: "medium", gluten: "no", lactose: "no", group: "low_residue", limitForGi: false, fructose: true, source: "CREA" },
  { id: "jam", cho100: 58.7, fibre100: null, unit: "g", gi: "medium", gluten: "no", lactose: "no", group: "low_residue", limitForGi: false, fructose: true, source: "INRAN" },
  { id: "orange_juice", cho100: 8.2, fibre100: 0, unit: "ml", gi: "medium", gluten: "no", lactose: "no", group: "low_residue", limitForGi: false, fructose: true, source: "INRAN" },
  { id: "banana", cho100: 15.4, fibre100: 1.8, unit: "g", gi: "medium", gluten: "no", lactose: "no", group: "other", limitForGi: true, fructose: false, source: "INRAN", hasNote: true },
  { id: "raisins", cho100: 72.0, fibre100: 5.2, unit: "g", gi: "medium", gluten: "no", lactose: "no", group: "other", limitForGi: true, fructose: false, source: "INRAN" },
  { id: "gummies", cho100: 77.5, fibre100: 0, unit: "g", gi: "high", gluten: "no", lactose: "no", group: "low_residue", limitForGi: false, fructose: false, source: "label", confidence: "heuristic", note: "chosen value" },
  { id: "maltodextrin", cho100: 95, fibre100: 0, unit: "g", gi: "high", gluten: "no", lactose: "no", group: "low_residue", limitForGi: false, fructose: false, source: "label", hasNote: true },
  { id: "sports_drink", cho100: 6, fibre100: 0, unit: "ml", gi: "high", gluten: "no", lactose: "no", group: "low_residue", limitForGi: false, fructose: false, source: "label" },
];

export const FOODS: readonly FoodEntry[] = rows.map(({ confidence, ...food }) => ({
  ...food,
  confidence: confidence ?? nutrientConfidence(food.source),
}));
