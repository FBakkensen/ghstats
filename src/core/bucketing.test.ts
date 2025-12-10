import { describe, expect, it, vi } from "bun:test";
import { eachDay, initDailyPoints, parseRange } from "./bucketing";
import type { TimeRange } from "../types/domain";

const fixedRange: TimeRange = {
  from: new Date(Date.UTC(2023, 0, 1)),
  to: new Date(Date.UTC(2023, 0, 3)),
  bucket: "day",
};

describe("bucketing", () => {
  it("creates inclusive day list", () => {
    const days = eachDay(fixedRange);
    expect(days.length).toBe(3);
    expect(days[0].getUTCDate()).toBe(1);
    expect(days[2].getUTCDate()).toBe(3);
  });

  it("initializes daily points with zero values", () => {
    const points = initDailyPoints(fixedRange);
    expect(points.map((p) => p.date)).toEqual([
      "2023-01-01",
      "2023-01-02",
      "2023-01-03",
    ]);
    expect(points.every((p) => p.value === 0)).toBe(true);
  });

  it("parses preset ranges relative to a fixed today", () => {
    const now = new Date(Date.UTC(2023, 0, 10));
    const range = parseRange("7d", "day", now);
    expect(range.from.toISOString().slice(0, 10)).toBe("2023-01-04");
    expect(range.to.toISOString().slice(0, 10)).toBe("2023-01-10");
    expect(range.bucket).toBe("day");
  });

  it("parses explicit ranges", () => {
    const range = parseRange("2023-01-05:2023-01-06", "day");
    expect(range.from.toISOString().slice(0, 10)).toBe("2023-01-05");
    expect(range.to.toISOString().slice(0, 10)).toBe("2023-01-06");
  });

  it("handles single-day explicit range inclusively", () => {
    const range = parseRange("2023-01-05:2023-01-05", "day");
    expect(range.from.toISOString().slice(0, 10)).toBe("2023-01-05");
    expect(range.to.toISOString().slice(0, 10)).toBe("2023-01-05");
    const points = initDailyPoints(range);
    expect(points.length).toBe(1);
    expect(points[0].date).toBe("2023-01-05");
  });

  it("rejects explicit ranges where from is after to", () => {
    expect(() => parseRange("2023-01-10:2023-01-01", "day")).toThrow();
  });

  it("rejects explicit ranges with invalid dates", () => {
    expect(() => parseRange("2023-99-01:2023-01-10", "day")).toThrow();
  });

  it("rejects unsupported buckets", () => {
    expect(() => parseRange("7d", "week")).toThrow("Phase 1 only supports daily buckets");
  });

  it("rejects invalid formats", () => {
    expect(() => parseRange("bad", "day")).toThrow();
  });
});
