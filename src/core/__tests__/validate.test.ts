import { describe, expect, it } from "vitest";
import { parseCarbLoadingInput } from "../index";
import { BASE, G1, G3 } from "./helpers";

const parse = (overrides: Record<string, unknown> = {}, today: string = BASE.today) =>
  parseCarbLoadingInput({ ...BASE, ...overrides }, today);
const errorsOf = (overrides: Record<string, unknown>, today?: string) => {
  const res = parse(overrides, today);
  if (res.ok) throw new Error("expected errors");
  return res.errors;
};
const without = (...keys: string[]) => {
  const raw: Record<string, unknown> = { ...BASE };
  for (const k of keys) delete raw[k];
  return parseCarbLoadingInput(raw, BASE.today);
};

describe("parseCarbLoadingInput", () => {
  it("accepts the base input", () => {
    expect(parse().ok).toBe(true);
  });

  it("reports every missing required field, not just the first", () => {
    const res = parseCarbLoadingInput({}, BASE.today);
    if (res.ok) throw new Error("expected errors");
    const fields = res.errors.map((e) => e.field);
    for (const f of ["weightKg", "age", "sex", "sport", "durationMin", "raceDate", "startTime", "giHistory", "diabetes"]) {
      expect(fields).toContain(f);
    }
    expect(res.errors.every((e) => e.type === "required")).toBe(true);
  });

  it("treats non-objects as empty", () => {
    expect(parseCarbLoadingInput(null, BASE.today).ok).toBe(false);
    expect(parseCarbLoadingInput("x", BASE.today).ok).toBe(false);
  });

  it("checks ranges with min and max", () => {
    expect(errorsOf({ weightKg: 34 })).toContainEqual({ field: "weightKg", type: "range", min: 35, max: 150 });
    expect(errorsOf({ weightKg: 151 })[0].type).toBe("range");
    expect(parse({ weightKg: 35.5 }).ok).toBe(true);
    expect(errorsOf({ age: 9 })[0]).toMatchObject({ field: "age", type: "range" });
    expect(errorsOf({ age: 30.5 })[0]).toMatchObject({ field: "age", type: "invalid" });
    expect(errorsOf({ durationMin: 9 })[0]).toMatchObject({ field: "durationMin", type: "range", min: 10, max: 2880 });
    expect(errorsOf({ durationMin: 2881 })[0].type).toBe("range");
  });

  it("rejects values that are not numbers", () => {
    expect(errorsOf({ weightKg: "70" })[0]).toMatchObject({ field: "weightKg", type: "invalid" });
    expect(errorsOf({ weightKg: Number.NaN })[0].type).toBe("invalid");
    expect(errorsOf({ weightKg: Infinity })[0].type).toBe("invalid");
  });

  it("checks enums", () => {
    expect(errorsOf({ sex: "x" })[0]).toMatchObject({ field: "sex", type: "invalid" });
    expect(errorsOf({ sport: "golf" })[0]).toMatchObject({ field: "sport", type: "invalid" });
    expect(errorsOf({ giHistory: "x" })[0].field).toBe("giHistory");
    expect(errorsOf({ diabetes: "x" })[0].field).toBe("diabetes");
    expect(errorsOf({ raceCarbs: "x" })[0].field).toBe("raceCarbs");
    expect(errorsOf({ preMealHours: 5 })[0].field).toBe("preMealHours");
    expect(errorsOf({ loadingDays: 4 })[0].field).toBe("loadingDays");
  });

  it("requires the yes/no health answers to be present", () => {
    for (const f of ["ibsDiagnosed", "coeliac", "lactoseIntolerance", "redsOrLowEnergyDiagnosis"]) {
      const res = without(f);
      if (res.ok) throw new Error("expected errors");
      expect(res.errors).toContainEqual({ field: f, type: "required" });
    }
    expect(errorsOf({ coeliac: "yes" })[0]).toMatchObject({ field: "coeliac", type: "invalid" });
  });

  it("requires pregnancy and amenorrhea answers only for non-male athletes", () => {
    const female = { sex: "female" };
    const res = parseCarbLoadingInput({ ...BASE, ...female, pregnant: undefined, amenorrhea3Months: undefined }, BASE.today);
    if (res.ok) throw new Error("expected errors");
    expect(res.errors.map((e) => e.field)).toEqual(["pregnant", "amenorrhea3Months"]);
    expect(without("pregnant", "amenorrhea3Months").ok).toBe(true);
  });

  it("validates the race date", () => {
    expect(errorsOf({ raceDate: "2026-11-01" })[0].type).toBe("raceTooSoon");
    expect(errorsOf({ raceDate: "2026-10-01" })[0].type).toBe("raceTooSoon");
    expect(parse({ raceDate: "2026-11-02", lastHardSession: { kind: "none_recent" } }).ok).toBe(true);
    expect(errorsOf({ raceDate: "2027-11-02", lastHardSession: { kind: "none_recent" } })[0]).toMatchObject({ type: "raceTooFar", max: 365 });
    expect(parse({ raceDate: "2027-11-01", lastHardSession: { kind: "none_recent" } }).ok).toBe(true);
    expect(errorsOf({ raceDate: "2026-02-30" })[0].type).toBe("invalid");
    expect(errorsOf({ raceDate: "15/11/2026" })[0].type).toBe("invalid");
  });

  it("validates the start time", () => {
    for (const bad of ["9:00", "24:00", "09:60", "0900", "ab"]) expect(errorsOf({ startTime: bad })[0].type).toBe("invalid");
    expect(parse({ startTime: "00:00" }).ok).toBe(true);
    expect(parse({ startTime: "23:59" }).ok).toBe(true);
  });

  it("validates days since the last race", () => {
    expect(errorsOf({ daysSinceLastRace: 31 })[0]).toMatchObject({ type: "range", min: 0, max: 30 });
    expect(errorsOf({ daysSinceLastRace: -1 })[0].type).toBe("range");
    expect(parse({ daysSinceLastRace: 0 }).ok).toBe(true);
    for (const empty of [undefined, null, "", "none"]) {
      const res = parse({ daysSinceLastRace: empty });
      expect(res.ok && res.input.daysSinceLastRace).toBe("none");
    }
  });

  it("validates the last hard session", () => {
    expect(errorsOf({ lastHardSession: { kind: "date", date: "2026-11-15" } })[0].type).toBe("sessionAfterRace");
    expect(errorsOf({ lastHardSession: { kind: "date", date: "2026-11-20" } })[0].type).toBe("sessionAfterRace");
    expect(errorsOf({ lastHardSession: { kind: "date", date: "2026-10-31" } })[0]).toMatchObject({ type: "sessionTooOld", max: 14 });
    expect(parse({ lastHardSession: { kind: "date", date: "2026-11-01" } }).ok).toBe(true);
    expect(parse({ lastHardSession: { kind: "date", date: G1 } }).ok).toBe(true);
    expect(errorsOf({ lastHardSession: { kind: "date", date: "" } })[0].type).toBe("required");
    expect(errorsOf({ lastHardSession: { kind: "date", date: "nope" } })[0].type).toBe("invalid");
    expect(errorsOf({ lastHardSession: { kind: "x" } })[0].type).toBe("invalid");
    expect(errorsOf({ lastHardSession: undefined })[0]).toEqual({ field: "lastHardSession", type: "required" });
  });

  it("requires race carbs and the last session only above 90 minutes", () => {
    const res = parseCarbLoadingInput({ ...BASE, raceCarbs: undefined, lastHardSession: undefined }, BASE.today);
    if (res.ok) throw new Error("expected errors");
    expect(res.errors.map((e) => e.field)).toEqual(["raceCarbs", "lastHardSession"]);
    expect(parse({ durationMin: 90, raceCarbs: undefined, lastHardSession: undefined }).ok).toBe(true);
  });

  it("requires the pre-race meal hours only above 60 minutes", () => {
    expect(errorsOf({ durationMin: 61, preMealHours: undefined })[0]).toEqual({ field: "preMealHours", type: "required" });
    expect(parse({ durationMin: 60, preMealHours: undefined }).ok).toBe(true);
  });

  it("drops conditional fields that are not needed", () => {
    const res = parse({ durationMin: 55, raceCarbs: "garbage", lastHardSession: "garbage", preMealHours: 9, loadingDays: 9, doseLevel: "x" });
    if (!res.ok) throw new Error(JSON.stringify(res.errors));
    for (const key of ["raceCarbs", "lastHardSession", "preMealHours", "bigMealTolerance", "loadingDays", "doseLevel"]) {
      expect(res.input).not.toHaveProperty(key);
    }
    const fuelUp = parse({ durationMin: 80, raceCarbs: "garbage", lastHardSession: "garbage", doseLevel: "x" });
    if (!fuelUp.ok) throw new Error(JSON.stringify(fuelUp.errors));
    expect(fuelUp.input).not.toHaveProperty("raceCarbs");
    expect(fuelUp.input.preMealHours).toBe(2);
  });

  it("applies the defaults", () => {
    const res = without("usualDiet", "loadingDays", "bigMealTolerance", "daysSinceLastRace");
    if (!res.ok) throw new Error(JSON.stringify(res.errors));
    expect(res.input).toMatchObject({
      usualDiet: "mixed",
      loadingDays: 2,
      bigMealTolerance: "normal",
      daysSinceLastRace: "none",
    });
    expect(res.input).not.toHaveProperty("doseLevel");
  });

  it("rejects an invalid today", () => {
    const res = parseCarbLoadingInput({ ...BASE }, "nope");
    expect(res.ok).toBe(false);
  });

  it("keeps the session range relative to the race date", () => {
    expect(parse({ lastHardSession: { kind: "date", date: G3 } }).ok).toBe(true);
  });
});
