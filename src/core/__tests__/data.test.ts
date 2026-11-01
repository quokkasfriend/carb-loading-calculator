import { describe, expect, it } from "vitest";
import { FOODS } from "../data/foods";
import { THRESHOLDS } from "../data/thresholds";
import { WARNING_REGISTRY } from "../data/warnings";

const CONFIDENCES = ["high", "medium", "low", "heuristic"];

describe("data files", () => {
  it.each(Object.entries(THRESHOLDS))("threshold %s has source and confidence", (_key, entry) => {
    expect(entry.source).not.toBe("");
    expect(CONFIDENCES).toContain(entry.confidence);
    expect(entry.value).not.toBeUndefined();
  });

  it.each(Object.entries(WARNING_REGISTRY))("warning %s has source and confidence", (_code, entry) => {
    expect(entry.source).not.toBe("");
    expect(CONFIDENCES).toContain(entry.confidence);
    expect(["block", "warning", "info"]).toContain(entry.severity);
  });

  it.each(FOODS.map((f) => [f.id, f] as const))("food %s has source and confidence", (_id, food) => {
    expect(food.source).not.toBe("");
    expect(CONFIDENCES).toContain(food.confidence);
  });

  it("fixes the confidence of the foods", () => {
    const byId = Object.fromEntries(FOODS.map((f) => [f.id, f.confidence]));
    expect(byId.pasta).toBe("high");
    expect(byId.honey).toBe("high");
    expect(byId.rice_cakes).toBe("medium");
    expect(byId.gummies).toBe("heuristic");
  });

  it("has unique food ids", () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
  });
});
