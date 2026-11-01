import { describe, expect, it } from "vitest";
import { G1, G2, loadingPlanOf, planOf, warningCodes } from "./helpers";

// The 15 golden cases: the contract of the engine.
describe("golden cases", () => {
  it("1 · 60–89 g/h in race, meal 3 h before", () => {
    const p = loadingPlanOf({ raceCarbs: "60_89", preMealHours: 3 });
    expect(p.days.map((d) => d.date)).toEqual([G2, G1]);
    for (const d of p.days) expect([d.carbsG, d.blocks, d.kcal, d.recharge.carbsG]).toEqual([700, 14, 3990, 280]);
    expect(p.days.map((d) => d.training.maxMin)).toEqual([60, 30]);
    expect(p.preRace).toMatchObject({ gMin: 140, gMax: 140, time: "06:00", dayOffset: 0 });
    expect(p.expectation).toBe("DOUBLE_BLIND_NO_BENEFIT");
    expect(warningCodes(p)).toEqual(["SPORT_WEAK_EVIDENCE"]);
  });

  it("2 · under 60 minutes", () => {
    const p = planOf({ weightKg: 60, sex: "female", durationMin: 55 });
    expect(p).toMatchObject({ loading: "no", reason: "UNDER_60", eligibility: "none" });
    expect(p).not.toHaveProperty("preRace");
    expect(p).not.toHaveProperty("foods");
    expect(p.warnings).toEqual([]);
  });

  it("3 · 80 minutes: fuel up the day before", () => {
    const p = planOf({ weightKg: 75, durationMin: 80, preMealHours: 2 });
    if (p.loading !== "no" || p.eligibility !== "fuel_up") throw new Error("expected fuel_up");
    expect(p.fuelUpDay).toMatchObject({ offset: 1, date: G1, carbsG: 530, blocks: 11, gPerKg: 7 });
    expect(p.preRace).toMatchObject({ gMin: 150, gMax: 150, time: "07:00" });
    expect(p.warnings).toEqual([]);
  });

  it("4 · diabetes blocks", () => {
    const p = planOf({ diabetes: "type_1", durationMin: 120 });
    expect(p).toMatchObject({ loading: "blocked", reasons: ["BLOCK_DIABETES"] });
  });

  it("5 · 80 kg, low carb, trail, 12 h", () => {
    const p = loadingPlanOf({ weightKg: 80, usualDiet: "lchf_keto", sport: "trail", durationMin: 720 });
    for (const d of p.days) expect([d.carbsG, d.blocks, d.kcal, d.recharge.carbsG]).toEqual([800, 16, 4560, 320]);
    expect(warningCodes(p)).toEqual(["LCHF", "SPORT_WEAK_EVIDENCE", "ULTRA"]);
  });

  it("6 · 17 years old blocks", () => {
    expect(planOf({ age: 17 })).toMatchObject({ loading: "blocked", reasons: ["BLOCK_MINOR"] });
  });

  it("7 · one day, high dose, hard session at D−2", () => {
    const p = loadingPlanOf({
      weightKg: 65,
      sex: "female",
      durationMin: 225,
      loadingDays: 1,
      doseLevel: "high",
      lastHardSession: { kind: "date", date: G2 },
    });
    expect(p.days).toHaveLength(1);
    expect(p.days[0]).toMatchObject({ offset: 1, carbsG: 780, blocks: 16, kcal: 4230 });
    expect(p.days[0].training.maxMin).toBe(30);
    expect(p.days[0].recharge.carbsG).toBe(310);
    expect(p.carbType).toEqual({ kind: "high_gi_half", minHighGiBlocks: 8 });
    expect(warningCodes(p)).toEqual(["SPORT_WEAK_EVIDENCE"]);
  });

  it("8 · 3 days asked, hard session at D−2, frequent gut problems", () => {
    const p = loadingPlanOf({
      weightKg: 72,
      durationMin: 195,
      loadingDays: 3,
      lastHardSession: { kind: "date", date: G2 },
      giHistory: "frequent",
    });
    expect(p.requestedDays).toBe(3);
    expect(p.days).toHaveLength(1);
    expect(p.days[0]).toMatchObject({ offset: 1, carbsG: 720, blocks: 14, kcal: 4100, fibre: "under_10g" });
    expect(p.days[0].recharge.carbsG).toBe(290);
    expect(p.dose).toMatchObject({ highAllowed: false, level: "standard" });
    const ids = p.foods.map((f) => f.id);
    expect(ids).not.toContain("banana");
    expect(ids).not.toContain("raisins");
    expect(warningCodes(p)).toEqual(["DAYS_REDUCED_SESSION", "FILTER_GI", "SPORT_WEAK_EVIDENCE"]);
  });

  it("9 · eating disorder history blocks", () => {
    expect(planOf({ eatingDisorderHistory: "yes" })).toMatchObject({ loading: "blocked", reasons: ["BLOCK_EATING_DISORDER"] });
  });

  it("10 · race 2 days ago", () => {
    const p = loadingPlanOf({ daysSinceLastRace: 2 });
    for (const d of p.days) expect(d.carbsG).toBe(700);
    expect(warningCodes(p)).toEqual(["BACK_TO_BACK_48H", "SPORT_WEAK_EVIDENCE"]);
  });

  it("12 · no carbs in race", () => {
    const p = loadingPlanOf({ raceCarbs: "zero" });
    for (const d of p.days) expect(d.carbsG).toBe(700);
    expect(p.expectation).toBe("NO_RACE_CARBS");
    expect(warningCodes(p)).toEqual(["SPORT_WEAK_EVIDENCE"]);
  });

  it("13 · amenorrhea", () => {
    const p = loadingPlanOf({ weightKg: 62, sex: "female", durationMin: 220, amenorrhea3Months: true });
    for (const d of p.days) expect([d.carbsG, d.blocks, d.kcal, d.recharge.carbsG]).toEqual([620, 12, 3530, 250]);
    expect(warningCodes(p)).toEqual(["REDS_DOCTOR", "SPORT_WEAK_EVIDENCE"]);
  });

  it("14 · 45 years old", () => {
    const p = loadingPlanOf({ age: 45 });
    for (const d of p.days) expect(d.carbsG).toBe(700);
    expect(warningCodes(p)).toEqual(["AGE_LIMITED_DATA", "SPORT_WEAK_EVIDENCE"]);
  });

  it("15 · hard session the day before the race", () => {
    const p = loadingPlanOf({ lastHardSession: { kind: "date", date: G1 } });
    expect(p.days).toHaveLength(1);
    expect(p.days[0].carbsG).toBe(700);
    expect(warningCodes(p)).toEqual(["SESSION_TOO_CLOSE", "SPORT_WEAK_EVIDENCE"]);
  });
});
