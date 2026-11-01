import { createTranslator } from "use-intl";
import { describe, expect, it } from "vitest";
import messages from "../../messages/en.json";
import { FOODS } from "../data/foods";
import { WARNING_REGISTRY } from "../data/warnings";
import { G1, G3, planOf } from "./helpers";

const ns = messages.CarbLoading as Record<string, unknown>;
const t = createTranslator({ locale: "en", messages: messages as never, namespace: "CarbLoading" as never }) as unknown as (
  key: string,
  values?: Record<string, string | number>,
) => string;

const lookup = (path: string): unknown => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], ns);

/** Plans that together emit every warning and block code. */
const SCENARIOS: Record<string, unknown>[] = [
  { diabetes: "type_1", age: 17, sex: "female", pregnant: true, eatingDisorderHistory: "yes" },
  {
    doseLevel: "high", giHistory: "frequent", lastHardSession: { kind: "date", date: G1 }, ibsDiagnosed: true,
    daysSinceLastRace: 3, durationMin: 300, usualDiet: "lchf_keto",
    coeliac: true, lactoseIntolerance: true, age: 40, eatingDisorderHistory: "prefer_not_to_say", redsOrLowEnergyDiagnosis: true,
  },
  { loadingDays: 3, lastHardSession: { kind: "date", date: G3 } },
  { today: "2026-11-14" },
  { daysSinceLastRace: 2 },
];

describe("messages (en › CarbLoading)", () => {
  it("has a text for every warning and block code", () => {
    for (const code of Object.keys(WARNING_REGISTRY)) {
      const group = code.startsWith("BLOCK_") ? "blocks" : "warnings";
      expect(typeof lookup(`${group}.${code}`), code).toBe("string");
    }
  });

  it("has a text for every reason, expectation and food", () => {
    for (const k of ["UNDER_60", "FUEL_UP_60_90", "LOADING_OVER_90"]) expect(typeof lookup(`reasons.${k}`), k).toBe("string");
    for (const k of ["NO_RACE_CARBS", "PLAUSIBLE", "DOUBLE_BLIND_NO_BENEFIT"]) expect(typeof lookup(`expectation.${k}`), k).toBe("string");
    for (const f of FOODS) {
      expect(typeof lookup(`foods.${f.id}.name`), f.id).toBe("string");
      if (f.hasNote) expect(typeof lookup(`foods.${f.id}.note`), `${f.id} note`).toBe("string");
    }
  });

  it("formats every emitted warning with the params the engine emits", () => {
    const seen = new Set<string>();
    for (const scenario of SCENARIOS) {
      for (const w of planOf(scenario).warnings) {
        seen.add(w.code);
        const group = w.code.startsWith("BLOCK_") ? "blocks" : "warnings";
        expect(() => t(`${group}.${w.code}`, w.params), w.code).not.toThrow();
        expect(t(`${group}.${w.code}`, w.params)).not.toBe("");
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(WARNING_REGISTRY).sort());
  });

  it("formats plural days in the reduction warnings", () => {
    expect(t("warnings.DAYS_REDUCED_DATE", { requested: 2, effective: 1 })).toContain("1 day");
    expect(t("warnings.DAYS_REDUCED_DATE", { requested: 3, effective: 2 })).toContain("2 days");
  });

  it("every text is valid ICU", () => {
    const walk = (node: unknown, path: string[]): void => {
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, [...path, String(i)]));
      if (typeof node === "object" && node !== null) {
        return Object.entries(node).forEach(([k, v]) => walk(v, [...path, k]));
      }
      const text = String(node);
      const args = Object.fromEntries([...text.matchAll(/\{(\w+)/g)].map((m) => [m[1], 1]));
      expect(() => t(path.join("."), args), path.join(".")).not.toThrow();
    };
    walk(ns, []);
  });
});
