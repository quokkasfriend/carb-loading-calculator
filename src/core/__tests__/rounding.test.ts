import { describe, expect, it } from "vitest";
import { round1, roundInt, roundTo } from "../rounding";

describe("rounding", () => {
  it("rounds half up to a step", () => {
    expect(roundTo(525, 10)).toBe(530);
    expect(roundTo(524.9, 10)).toBe(520);
    expect(roundTo(4225, 10)).toBe(4230);
    expect(roundTo(312, 10)).toBe(310);
  });
  it("rounds half up to an integer", () => {
    expect(roundInt(0.5)).toBe(1);
    expect(roundInt(10.6)).toBe(11);
    expect(roundInt(14.4)).toBe(14);
  });
  it("rounds half up to one decimal", () => {
    expect(round1(5.85)).toBe(5.9);
    expect(round1(0.8)).toBe(0.8);
    expect(round1(0)).toBe(0);
  });
});
