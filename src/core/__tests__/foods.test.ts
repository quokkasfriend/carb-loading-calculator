import { describe, expect, it } from "vitest";
import { foodExamples } from "../steps/foods";
import { loadingPlanOf } from "./helpers";

const none = { coeliac: false, lactoseIntolerance: false, giHistory: "none" } as const;
const byId = (list: ReturnType<typeof foodExamples>) => Object.fromEntries(list.map((f) => [f.id, f]));

describe("food examples", () => {
  it("computes the portion and fibre of one 50 g block", () => {
    const f = byId(foodExamples(none));
    const expected: Record<string, [number, number | { min: number; max: number } | null]> = {
      pasta: [63, 1.7],
      rice: [62, 0.6],
      bread: [79, 3.0],
      rusks: [61, 2.1],
      cornflakes: [57, 2.2],
      rice_cakes: [63, { min: 0.8, max: 3.3 }],
      potatoes: [279, 4.5],
      dry_biscuits: [59, 1.5],
      honey: [62, 0],
      jam: [85, null],
      orange_juice: [610, 0],
      banana: [325, 5.9],
      raisins: [69, 3.6],
      gummies: [65, 0],
      maltodextrin: [53, 0],
      sports_drink: [833, 0],
    };
    expect(Object.keys(f).sort()).toEqual(Object.keys(expected).sort());
    for (const [id, [portion, fibre]] of Object.entries(expected)) {
      expect(f[id].portion, id).toBe(portion);
      expect(f[id].fibrePortion, id).toEqual(fibre);
    }
    expect(f.orange_juice.unit).toBe("ml");
    expect(f.sports_drink.unit).toBe("ml");
  });

  it("coeliac: drops gluten foods, keeps check_label foods with a badge", () => {
    const list = foodExamples({ ...none, coeliac: true });
    const ids = list.map((x) => x.id);
    for (const gone of ["pasta", "bread", "rusks", "cornflakes", "dry_biscuits"]) expect(ids).not.toContain(gone);
    const cakes = list.find((x) => x.id === "rice_cakes");
    expect(cakes?.checkLabel).toBe(true);
    expect(list.find((x) => x.id === "rice")?.checkLabel).toBe(false);
  });

  it("lactose intolerance: keeps biscuits with a badge", () => {
    const list = foodExamples({ ...none, lactoseIntolerance: true });
    expect(list.find((x) => x.id === "dry_biscuits")?.checkLabel).toBe(true);
    expect(list.map((x) => x.id)).toContain("pasta");
  });

  it("sensitive gut: drops banana and raisins", () => {
    {
      const ids = foodExamples({ ...none, giHistory: "frequent" }).map((x) => x.id);
      expect(ids).not.toContain("banana");
      expect(ids).not.toContain("raisins");
    }
    expect(foodExamples({ ...none, giHistory: "occasional" }).map((x) => x.id)).toContain("banana");
  });

  it("orders the groups base, low residue, other, and keeps table order inside", () => {
    const list = foodExamples(none);
    expect(list.map((x) => x.group)).toEqual([
      ...Array(4).fill("base"),
      ...Array(6).fill("low_residue"),
      ...Array(6).fill("other"),
    ]);
    expect(list.slice(0, 4).map((x) => x.id)).toEqual(["pasta", "rice", "bread", "potatoes"]);
    expect(list.at(-1)?.id).toBe("raisins");
  });

  it("flags fructose sources and label-based values", () => {
    const f = byId(foodExamples(none));
    expect(f.honey.fructose && f.jam.fructose && f.orange_juice.fructose).toBe(true);
    expect(f.pasta.fructose).toBe(false);
    expect(f.gummies.labelSource).toBe(true);
    expect(f.pasta.labelSource).toBe(false);
  });

  it("are part of the plan", () => {
    expect(loadingPlanOf().foods).toHaveLength(16);
  });
});
