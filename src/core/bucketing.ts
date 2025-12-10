import {
  addDays,
  formatISO,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { Bucket, TimePoint, TimeRange } from "../types/domain";

const PRESETS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

function parsePreset(range?: string): number | null {
  if (!range) return PRESETS["30d"];
  return PRESETS[range] ?? null;
}

function parseExplicit(range: string): { from: Date; to: Date } | null {
  const [fromRaw, toRaw] = range.split(":");
  if (!fromRaw || !toRaw) return null;

  const from = startOfDay(parseISO(fromRaw));
  const to = startOfDay(parseISO(toRaw));
  if (!isValid(from) || !isValid(to)) return null;
  if (from > to) return null;

  return { from, to };
}

export function parseRange(
  range?: string,
  bucket: Bucket = "day",
  now: Date = new Date()
): TimeRange {
  if (bucket !== "day") {
    throw new Error("Phase 1 only supports daily buckets");
  }

  const presetDays = parsePreset(range);
  if (presetDays) {
    const to = startOfDay(now);
    const from = startOfDay(subDays(to, presetDays - 1));
    return { from, to, bucket };
  }

  if (!range) {
    throw new Error("Invalid range. Use presets (7d,30d,90d,1y) or YYYY-MM-DD:YYYY-MM-DD");
  }

  const explicit = parseExplicit(range);
  if (!explicit) {
    throw new Error("Invalid range format. Expected YYYY-MM-DD:YYYY-MM-DD");
  }

  return { ...explicit, bucket };
}

export function eachDay(range: TimeRange): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(range.from);
  const end = startOfDay(range.to);

  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

export function initDailyPoints(range: TimeRange): TimePoint[] {
  if (range.bucket !== "day") {
    throw new Error("Only daily points are supported in Phase 1");
  }

  return eachDay(range).map((date) => ({
    date: formatISO(date, { representation: "date" }),
    value: 0,
  }));
}
