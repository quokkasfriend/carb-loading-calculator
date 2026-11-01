import { describe, expect, it } from "vitest";
import { G1, G3, loadingPlanOf, makeInput, planOf, warningCodes } from "./helpers";
import { buildCarbLoadingPlan, defaultDoseLevel, isHighDoseAllowed } from "../index";

const firstWarning = (overrides: Record<string, unknown>, code: string) => {
  const w = planOf(overrides).warnings.find((x) => x.code === code);
  if (!w) throw new Error(`${code} not emitted`);
  return w;
};

describe("one test per row of the warning registry", () => {
  it("BLOCK_DIABETES", () => {
    const p = planOf({ diabetes: "type_2" });
    expect(p.warnings[0]).toMatchObject({ code: "BLOCK_DIABETES", severity: "block", trigger: { field: "diabetes", value: "type_2" } });
  });
  it("BLOCK_MINOR", () => {
    expect(planOf({ age: 17 }).warnings[0]).toMatchObject({ code: "BLOCK_MINOR", trigger: { field: "age" } });
  });
  it("BLOCK_PREGNANCY", () => {
    const p = planOf({ sex: "female", pregnant: true });
    expect(p).toMatchObject({ loading: "blocked", reasons: ["BLOCK_PREGNANCY"] });
    expect(p.warnings[0].trigger.field).toBe("pregnant");
  });
  it("BLOCK_EATING_DISORDER", () => {
    expect(planOf({ eatingDisorderHistory: "yes" }).warnings[0].trigger.field).toBe("eatingDisorderHistory");
  });
  it("HIGH_DOSE_UNAVAILABLE", () => {
    expect(firstWarning({ doseLevel: "high", giHistory: "occasional" }, "HIGH_DOSE_UNAVAILABLE").trigger.field).toBe("doseLevel");
  });
  it("SESSION_TOO_CLOSE", () => {
    expect(firstWarning({ lastHardSession: { kind: "date", date: G1 } }, "SESSION_TOO_CLOSE").trigger.field).toBe("lastHardSession");
  });
  it("DAYS_REDUCED_SESSION", () => {
    const w = firstWarning({ loadingDays: 3, lastHardSession: { kind: "date", date: G3 } }, "DAYS_REDUCED_SESSION");
    expect(w.params).toEqual({ requested: 3, effective: 2, sessionDate: G3 });
  });
  it("DAYS_REDUCED_DATE", () => {
    const w = firstWarning({ today: "2026-11-14" }, "DAYS_REDUCED_DATE");
    expect(w).toMatchObject({ trigger: { field: "raceDate" }, params: { requested: 2, effective: 1 } });
  });
  it("IBS", () => {
    expect(firstWarning({ ibsDiagnosed: true }, "IBS").trigger.field).toBe("ibsDiagnosed");
  });
  it("SPORT_WEAK_EVIDENCE only outside cycling", () => {
    expect(firstWarning({ sport: "other" }, "SPORT_WEAK_EVIDENCE").trigger.field).toBe("sport");
    expect(warningCodes(planOf({ sport: "cycling" }))).not.toContain("SPORT_WEAK_EVIDENCE");
  });
  it("BACK_TO_BACK_48H", () => {
    expect(firstWarning({ daysSinceLastRace: 1 }, "BACK_TO_BACK_48H").trigger.field).toBe("daysSinceLastRace");
  });
  it("BACK_TO_BACK_UNCERTAIN", () => {
    expect(firstWarning({ daysSinceLastRace: 3 }, "BACK_TO_BACK_UNCERTAIN").params).toEqual({ days: 3 });
  });
  it("ULTRA", () => {
    expect(firstWarning({ durationMin: 300 }, "ULTRA").trigger.field).toBe("durationMin");
  });
  it("LCHF", () => {
    expect(firstWarning({ usualDiet: "lchf_keto" }, "LCHF").trigger.field).toBe("usualDiet");
  });
  it("FILTER_GLUTEN", () => {
    expect(firstWarning({ coeliac: true }, "FILTER_GLUTEN").trigger.field).toBe("coeliac");
  });
  it("FILTER_LACTOSE", () => {
    expect(firstWarning({ lactoseIntolerance: true }, "FILTER_LACTOSE").trigger.field).toBe("lactoseIntolerance");
  });
  it("FILTER_GI", () => {
    expect(firstWarning({ giHistory: "frequent" }, "FILTER_GI").trigger.field).toBe("giHistory");
  });
  it("AGE_LIMITED_DATA", () => {
    expect(firstWarning({ age: 38 }, "AGE_LIMITED_DATA").trigger.field).toBe("age");
  });
  it("REDS_SUPPORT", () => {
    expect(firstWarning({ eatingDisorderHistory: "prefer_not_to_say" }, "REDS_SUPPORT").trigger.field).toBe("eatingDisorderHistory");
  });
  it("REDS_DOCTOR: first true field is the trigger", () => {
    const both = { sex: "female", redsOrLowEnergyDiagnosis: true, amenorrhea3Months: true };
    expect(firstWarning(both, "REDS_DOCTOR").trigger.field).toBe("redsOrLowEnergyDiagnosis");
    expect(firstWarning({ sex: "female", amenorrhea3Months: true }, "REDS_DOCTOR").trigger.field).toBe("amenorrhea3Months");
  });
  it("every warning carries source and confidence from the registry", () => {
    for (const w of planOf({ usualDiet: "lchf_keto" }).warnings) {
      expect(w.source).not.toBe("");
      expect(["high", "medium", "low", "heuristic"]).toContain(w.confidence);
    }
  });
});

describe("safety", () => {
  it.each([
    [{ diabetes: "type_1" }, "BLOCK_DIABETES"],
    [{ age: 17 }, "BLOCK_MINOR"],
    [{ sex: "female", pregnant: true }, "BLOCK_PREGNANCY"],
    [{ eatingDisorderHistory: "yes" }, "BLOCK_EATING_DISORDER"],
  ])("a single block gives a blocked plan with no numbers (%o)", (overrides, code) => {
    const p = planOf(overrides);
    expect(p.loading).toBe("blocked");
    expect(Object.keys(p).sort()).toEqual(["loading", "reasons", "warnings"]);
    expect((p as { reasons: string[] }).reasons).toEqual([code]);
  });

  it("several blocks are all reported, in the order of step 1", () => {
    const p = planOf({ diabetes: "type_1", age: 17, sex: "female", pregnant: true, eatingDisorderHistory: "yes" });
    expect(p).toMatchObject({
      loading: "blocked",
      reasons: ["BLOCK_DIABETES", "BLOCK_MINOR", "BLOCK_PREGNANCY", "BLOCK_EATING_DISORDER"],
    });
  });

  it("prefer_not_to_say keeps the numbers and adds REDS_SUPPORT", () => {
    const p = loadingPlanOf({ eatingDisorderHistory: "prefer_not_to_say" });
    expect(p.days.length).toBeGreaterThan(0);
    expect(warningCodes(p)).toContain("REDS_SUPPORT");
  });

  it("male athletes: pregnancy and amenorrhea answers are ignored", () => {
    const input = makeInput({ sex: "male", pregnant: true, amenorrhea3Months: true });
    expect(input.pregnant).toBe(false);
    expect(input.amenorrhea3Months).toBe(false);
    expect(planOf({ sex: "male", pregnant: true }).loading).toBe("yes");
  });

  it("high dose with gut problems falls back to 10 g/kg and says so", () => {
    const p = loadingPlanOf({ doseLevel: "high", giHistory: "occasional" });
    expect(p.dose).toMatchObject({ level: "standard", gPerKg: 10, highAllowed: false });
    expect(warningCodes(p)).toContain("HIGH_DOSE_UNAVAILABLE");
  });

  it("dose helpers", () => {
    expect(isHighDoseAllowed("none")).toBe(true);
    expect(isHighDoseAllowed("occasional")).toBe(false);
    expect(defaultDoseLevel()).toBe("standard");
  });

  it("duration boundaries", () => {
    const eligibility = (durationMin: number) => planOf({ durationMin }).loading === "yes" ? "loading" : (planOf({ durationMin }) as { eligibility: string }).eligibility;
    expect(eligibility(59)).toBe("none");
    expect(eligibility(60)).toBe("fuel_up");
    expect(eligibility(90)).toBe("fuel_up");
    expect(eligibility(91)).toBe("loading");
    expect(planOf({ durationMin: 60 })).not.toHaveProperty("preRace");
    expect(planOf({ durationMin: 61 })).toHaveProperty("preRace");
    expect(warningCodes(planOf({ durationMin: 240 }))).not.toContain("ULTRA");
    expect(warningCodes(planOf({ durationMin: 241 }))).toContain("ULTRA");
  });

  it("age boundaries", () => {
    expect(planOf({ age: 17 }).loading).toBe("blocked");
    expect(planOf({ age: 18 }).loading).toBe("yes");
    expect(warningCodes(planOf({ age: 37 }))).not.toContain("AGE_LIMITED_DATA");
    expect(warningCodes(planOf({ age: 38 }))).toContain("AGE_LIMITED_DATA");
  });

  it("back-to-back races", () => {
    expect(warningCodes(planOf({ daysSinceLastRace: 2 }))).toContain("BACK_TO_BACK_48H");
    expect(warningCodes(planOf({ daysSinceLastRace: 3 }))).toContain("BACK_TO_BACK_UNCERTAIN");
    const four = warningCodes(planOf({ daysSinceLastRace: 4 }));
    expect(four).not.toContain("BACK_TO_BACK_48H");
    expect(four).not.toContain("BACK_TO_BACK_UNCERTAIN");
  });

  it("a race too close to today removes loading days", () => {
    const p = loadingPlanOf({ today: "2026-11-14" });
    expect(p.days).toHaveLength(1);
    expect(warningCodes(p)).toContain("DAYS_REDUCED_DATE");
  });

  it("no recent hard session: the three days stay, day D−3 trains up to 60 minutes", () => {
    const p = loadingPlanOf({ lastHardSession: { kind: "none_recent" }, loadingDays: 3 });
    expect(p.days.map((d) => d.offset)).toEqual([3, 2, 1]);
    expect(p.days.map((d) => d.training.maxMin)).toEqual([60, 60, 30]);
    expect(p.hardSessionLatest).toBe("2026-11-11");
  });

  it("pre-race meal", () => {
    const meal = (o: Record<string, unknown>) => loadingPlanOf(o).preRace;
    expect(meal({ preMealHours: 1 })).toMatchObject({ gPerKgMin: 1, gMin: 70 });
    expect(meal({ bigMealTolerance: "high", preMealHours: 4 })).toMatchObject({ gMin: 140, gMax: 280 });
    expect(meal({ bigMealTolerance: "high", preMealHours: 2 })).toMatchObject({ gMin: 140, gMax: 140 });
    expect(meal({ bigMealTolerance: "low", preMealHours: 3 })).toMatchObject({ gMin: 140, gMax: 140 });
    expect(meal({ startTime: "02:00", preMealHours: 3 })).toMatchObject({ time: "23:00", dayOffset: -1 });
    expect(meal({ startTime: "12:00" })).toMatchObject({ usualMealsBefore: true });
    expect(meal({ startTime: "11:59" })).toMatchObject({ usualMealsBefore: false });
  });

  it("is deterministic", () => {
    const input = makeInput();
    expect(buildCarbLoadingPlan(input)).toEqual(buildCarbLoadingPlan(input));
  });
});
