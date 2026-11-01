import { describe, expect, it } from "vitest";
import { addDays, formatDate, formatTime, gap, parseDate, parseTime, subtractHours } from "../dates";

describe("dates", () => {
  it("round-trips a date", () => {
    const days = parseDate("2026-11-15");
    expect(days).not.toBeNull();
    expect(formatDate(days as number)).toBe("2026-11-15");
  });
  it("rejects dates that do not exist", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("2026-13-01")).toBeNull();
    expect(parseDate("26-11-15")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
  it("counts whole days across the daylight saving change (25–26 October 2026)", () => {
    expect(gap("2026-10-24", "2026-10-27")).toBe(3);
    expect(gap("2026-10-25", "2026-10-26")).toBe(1);
    expect(addDays("2026-10-24", 3)).toBe("2026-10-27");
    expect(addDays("2026-10-27", -3)).toBe("2026-10-24");
  });
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(gap("2026-11-15", "2026-11-01")).toBe(-14);
  });
  it("parses and formats times", () => {
    expect(parseTime("09:05")).toBe(545);
    expect(parseTime("24:00")).toBeNull();
    expect(formatTime(545)).toBe("09:05");
  });
  it("subtracts hours and wraps past midnight", () => {
    expect(subtractHours("09:00", 2)).toEqual({ time: "07:00", dayOffset: 0 });
    expect(subtractHours("02:00", 3)).toEqual({ time: "23:00", dayOffset: -1 });
    expect(subtractHours("03:00", 3)).toEqual({ time: "00:00", dayOffset: 0 });
  });
});
