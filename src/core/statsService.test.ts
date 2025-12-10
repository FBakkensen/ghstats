import { describe, expect, it, vi } from "bun:test";
import { getStats } from "./statsService";
import type { TimeRange } from "../types/domain";

const mockEvents = [
  {
    type: "PushEvent",
    created_at: "2023-01-02T12:00:00Z",
    payload: { size: 2 },
  },
  {
    type: "PushEvent",
    created_at: "2023-01-02T14:00:00Z",
    payload: { commits: [{}, {}] },
  },
  {
    type: "PullRequestEvent",
    created_at: "2023-01-02T13:00:00Z",
    payload: { action: "opened", pull_request: { merged: false } },
  },
  {
    type: "PullRequestEvent",
    created_at: "2023-01-03T09:00:00Z",
    payload: { action: "closed", pull_request: { merged: true } },
  },
  {
    type: "IssuesEvent",
    created_at: "2023-01-03T10:00:00Z",
    payload: { action: "opened" },
  },
];

const mockGetAuthenticatedUser = vi.fn().mockResolvedValue("alice");
const mockGetUserEventsInRange = vi.fn().mockResolvedValue(mockEvents);

vi.mock("../infra/githubClient", () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
  getUserEventsInRange: mockGetUserEventsInRange,
}));

describe("statsService", () => {
  const range: TimeRange = {
    from: new Date(Date.UTC(2023, 0, 1)),
    to: new Date(Date.UTC(2023, 0, 3)),
    bucket: "day",
  };

  it("aggregates commits and PRs into summary and timeline", async () => {
    mockGetUserEventsInRange.mockResolvedValueOnce(mockEvents);
    const { username, summary, timeline } = await getStats(range);

    expect(username).toBe("alice");
    expect(summary).toEqual({
      range,
      commits: 4, // 2 from size + 2 from commits array
      prsOpened: 1,
      prsMerged: 1,
    });

    expect(timeline.metric).toBe("commits");
    expect(timeline.points.length).toBe(3);

    const day2 = timeline.points.find((p) => p.date === "2023-01-02");
    const day3 = timeline.points.find((p) => p.date === "2023-01-03");
    expect(day2?.value).toBe(4);
    expect(day3?.value).toBe(0);
  });

  it("returns zeros when no events exist", async () => {
    mockGetUserEventsInRange.mockResolvedValueOnce([]);
    const { summary, timeline } = await getStats(range);

    expect(summary.commits).toBe(0);
    expect(summary.prsOpened).toBe(0);
    expect(summary.prsMerged).toBe(0);
    expect(timeline.points.every((p) => p.value === 0)).toBe(true);
  });

  it("does not count closed-unmerged PRs as merged", async () => {
    const events = [
      {
        type: "PullRequestEvent" as const,
        created_at: "2023-01-02T10:00:00Z",
        payload: { action: "closed", pull_request: { merged: false } },
      },
    ];
    mockGetUserEventsInRange.mockResolvedValueOnce(events);
    const { summary } = await getStats(range);

    expect(summary.prsOpened).toBe(0);
    expect(summary.prsMerged).toBe(0);
  });

  it("aggregates commits weekly when bucket=week", async () => {
    const weeklyRange: TimeRange = {
      from: new Date(Date.UTC(2023, 0, 1)),
      to: new Date(Date.UTC(2023, 0, 15)),
      bucket: "week",
    };

    const events = [
      { type: "PushEvent" as const, created_at: "2023-01-02T12:00:00Z", payload: { size: 1 } },
      { type: "PushEvent" as const, created_at: "2023-01-06T08:00:00Z", payload: { size: 2 } },
      { type: "PushEvent" as const, created_at: "2023-01-12T08:00:00Z", payload: { size: 1 } },
    ];

    mockGetUserEventsInRange.mockResolvedValueOnce(events as any);
    const { summary, timeline } = await getStats(weeklyRange);

    expect(summary.commits).toBe(4);
    expect(timeline.range.bucket).toBe("week");
    expect(timeline.points.map((p) => p.date)).toEqual([
      "2022-12-26",
      "2023-01-02",
      "2023-01-09",
    ]);

    const jan2Week = timeline.points.find((p) => p.date === "2023-01-02");
    const jan9Week = timeline.points.find((p) => p.date === "2023-01-09");
    expect(jan2Week?.value).toBe(3);
    expect(jan9Week?.value).toBe(1);
  });

  it("counts PushEvent using distinct_size when commits are hidden", async () => {
    const events = [
      {
        type: "PushEvent" as const,
        created_at: "2023-01-02T12:00:00Z",
        payload: { distinct_size: 5 },
      },
    ];

    mockGetUserEventsInRange.mockResolvedValueOnce(events as any);
    const { summary, timeline } = await getStats(range);

    expect(summary.commits).toBe(5);
    const day = timeline.points.find((p) => p.date === "2023-01-02");
    expect(day?.value).toBe(5);
  });

  it("propagates errors from the GitHub client", async () => {
    mockGetUserEventsInRange.mockRejectedValueOnce(new Error("boom"));
    await expect(getStats(range)).rejects.toThrow("boom");
  });

  it("produces a single-day timeline when range covers one day", async () => {
    const singleDayRange: TimeRange = {
      from: new Date(Date.UTC(2023, 0, 2)),
      to: new Date(Date.UTC(2023, 0, 2)),
      bucket: "day",
    };

    mockGetUserEventsInRange.mockResolvedValueOnce([
      {
        type: "PushEvent" as const,
        created_at: "2023-01-02T12:00:00Z",
        payload: { size: 1 },
      },
    ]);

    const { summary, timeline } = await getStats(singleDayRange);
    expect(summary.commits).toBe(1);
    expect(timeline.points).toHaveLength(1);
    expect(timeline.points[0]).toEqual({ date: "2023-01-02", value: 1 });
  });
});
