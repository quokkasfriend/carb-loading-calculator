import { describe, expect, it } from "vitest";
import { BASE } from "../../core/__tests__/helpers";
import { applyPatch, initialFormState, localDate, toRaw, validateStep, visibleSteps, type FormState } from "../formState";

const TODAY = BASE.today;

/** The form as filled for golden case 1. */
function filled(overrides: Partial<FormState> = {}): FormState {
  return {
    ...initialFormState(),
    sport: "road_running",
    raceDate: BASE.raceDate,
    startTime: BASE.startTime,
    duration: { h: "3", m: "30" },
    weightKg: "70",
    age: "30",
    sex: "male",
    giHistory: "none",
    ibsDiagnosed: "no",
    coeliac: "no",
    lactoseIntolerance: "no",
    lastHardSessionDate: BASE.lastHardSession.date,
    raceCarbs: "60_89",
    preMealHours: "3",
    diabetes: "no",
    eatingDisorderHistory: "no",
    redsOrLowEnergyDiagnosis: "no",
    ...overrides,
  };
}

describe("visibleSteps", () => {
  it("hides the preparation step for short races", () => {
    const steps = (h: string, m: string) => visibleSteps({ ...initialFormState(), duration: { h, m } });
    expect(steps("", "55")).toEqual(["race", "athlete", "gutDiet", "health"]);
    expect(steps("", "60")).toEqual(["race", "athlete", "gutDiet", "health"]);
    expect(steps("1", "20")).toEqual(["race", "athlete", "gutDiet", "prep", "health"]);
    expect(steps("3", "30")).toEqual(["race", "athlete", "gutDiet", "prep", "health"]);
  });
  it("hides it while the duration is empty", () => {
    expect(visibleSteps(initialFormState())).not.toContain("prep");
  });
});

describe("validateStep", () => {
  it("asks for every required field of the first step", () => {
    const errors = validateStep(initialFormState(), "race", TODAY);
    expect(Object.keys(errors).sort()).toEqual(["durationMin", "raceDate", "sport", "startTime"]);
    expect(errors.sport.type).toBe("required");
  });
  it("only reports the fields of the step", () => {
    const errors = validateStep(filled({ weightKg: "" }), "race", TODAY);
    expect(errors).toEqual({});
    expect(validateStep(filled({ weightKg: "" }), "athlete", TODAY).weightKg.type).toBe("required");
  });
  it("reports ranges and dates", () => {
    expect(validateStep(filled({ weightKg: "20" }), "athlete", TODAY).weightKg).toMatchObject({ type: "range", min: 35, max: 150 });
    expect(validateStep(filled({ raceDate: TODAY }), "race", TODAY).raceDate.type).toBe("raceTooSoon");
    expect(validateStep(filled({ lastHardSessionDate: BASE.raceDate }), "prep", TODAY).lastHardSession.type).toBe("sessionAfterRace");
  });
  it("requires every health answer, no preselection", () => {
    const errors = validateStep(initialFormState(), "health", TODAY);
    expect(Object.keys(errors).sort()).toEqual(["amenorrhea3Months", "diabetes", "eatingDisorderHistory", "pregnant", "redsOrLowEnergyDiagnosis"].sort());
    expect(validateStep({ ...initialFormState(), sex: "male" }, "health", TODAY).pregnant).toBeUndefined();
  });
  it("requires the yes/no questions of the gut step", () => {
    const errors = validateStep(initialFormState(), "gutDiet", TODAY);
    expect(Object.keys(errors).sort()).toEqual(["coeliac", "giHistory", "ibsDiagnosed", "lactoseIntolerance"]);
  });
  it("accepts a complete form in every step", () => {
    for (const step of visibleSteps(filled())) expect(validateStep(filled(), step, TODAY)).toEqual({});
  });
});

describe("toRaw", () => {
  it("converts strings to numbers and yes/no to booleans", () => {
    const raw = toRaw(filled({ weightKg: "70,5", daysSinceLastRace: "2" }));
    expect(raw).toMatchObject({ weightKg: 70.5, age: 30, durationMin: 210, daysSinceLastRace: 2, ibsDiagnosed: false, preMealHours: 3, loadingDays: 2 });
    expect(raw.lastHardSession).toEqual({ kind: "date", date: BASE.lastHardSession.date });
  });
  it("keeps empty fields undefined", () => {
    const raw = toRaw(initialFormState());
    expect(raw.weightKg).toBeUndefined();
    expect(raw.durationMin).toBeUndefined();
    expect(raw.ibsDiagnosed).toBeUndefined();
  });
  it("sends none_recent when the box is ticked", () => {
    expect(toRaw(filled({ noRecentHardSession: true })).lastHardSession).toEqual({ kind: "none_recent" });
  });
});

describe("dose preselection", () => {
  it("returns to the default when the gut history changes", () => {
    const high = filled({ doseLevel: "high" });
    expect(applyPatch(high, { giHistory: "frequent" }).doseLevel).toBe("standard");
    expect(applyPatch(high, { age: "31" }).doseLevel).toBe("high");
  });
});

describe("localDate", () => {
  it("formats the local date", () => {
    expect(localDate(new Date(2026, 10, 1, 23, 59))).toBe("2026-11-01");
  });
});
