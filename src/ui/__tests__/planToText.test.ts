import { createTranslator } from "use-intl";
import { describe, expect, it } from "vitest";
import messages from "../../messages/en.json";
import { planOf } from "../../core/__tests__/helpers";
import { planToText } from "../planToText";
import type { Translate } from "../view";

const t = createTranslator({ locale: "en", messages: messages as never, namespace: "CarbLoading" as never }) as unknown as Translate;
const text = (overrides: Record<string, unknown>) => planToText(planOf(overrides), t, (iso) => iso, "en");

describe("planToText", () => {
  it("case 1 contains the numbers of the plan", () => {
    const out = text({ raceCarbs: "60_89", preMealHours: 3 });
    expect(out).toContain("700 g");
    expect(out).toContain("3990 kcal");
    expect(out).toContain("06:00");
    expect(out).toContain("D−2 · 2026-11-13");
    expect(out).toContain("Carb loading: yes");
    expect(out).toContain("A block is a portion of food that contains 50 g of carbs");
    expect(out).toContain("79.1 g per 100 g");
  });

  it("a blocked plan has no grams and no calories", () => {
    for (const overrides of [{ diabetes: "type_1" }, { age: 17 }, { eatingDisorderHistory: "yes" }]) {
      const out = text(overrides);
      expect(out).not.toMatch(/\d+ ?g\b/);
      expect(out).not.toContain("kcal");
      expect(out).toContain("No numeric plan");
    }
  });

  it("a fuel-up plan names the day before and the meal", () => {
    const out = text({ weightKg: 75, durationMin: 80, preMealHours: 2 });
    expect(out).toContain("530 g");
    expect(out).toContain("07:00");
    expect(out).toContain("Carb loading: no");
  });

  it("a short race gets the explanation only", () => {
    const out = text({ durationMin: 55 });
    expect(out).toContain("under an hour");
    expect(out).not.toContain("kcal");
  });

  it("puts the pre-race meal on the previous day when it falls before midnight", () => {
    expect(text({ startTime: "02:00", preMealHours: 3 })).toContain("(the day before the race)");
  });
});
