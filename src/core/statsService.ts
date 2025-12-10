import { formatISO, startOfDay } from "date-fns";
import { initDailyPoints } from "./bucketing";
import { getAuthenticatedUser, getUserEventsInRange } from "../infra/githubClient";
import type { SummaryStats, TimeRange, Timeline } from "../types/domain";

export interface StatsBundle {
  username: string;
  summary: SummaryStats;
  timeline: Timeline;
}

function dayKey(dateString: string): string {
  const day = startOfDay(new Date(dateString));
  return formatISO(day, { representation: "date" });
}

function countCommits(event: any): number {
  if (typeof event?.payload?.size === "number") return event.payload.size;
  if (Array.isArray(event?.payload?.commits)) return event.payload.commits.length;
  return 0;
}

export async function getStats(range: TimeRange): Promise<StatsBundle> {
  const username = await getAuthenticatedUser();
  const events = await getUserEventsInRange(username, range);

  const points = initDailyPoints(range);
  const pointIndex = new Map(points.map((p) => [p.date, p]));

  const summary: SummaryStats = {
    range,
    commits: 0,
    prsOpened: 0,
    prsMerged: 0,
  };

  for (const event of events) {
    const key = dayKey(event.created_at);
    switch (event.type) {
      case "PushEvent": {
        const count = countCommits(event);
        summary.commits += count;
        const target = pointIndex.get(key);
        if (target) target.value += count;
        break;
      }
      case "PullRequestEvent": {
        const action = (event as any).payload?.action;
        if (action === "opened") summary.prsOpened += 1;
        if (action === "closed" && (event as any).payload?.pull_request?.merged) {
          summary.prsMerged += 1;
        }
        break;
      }
      default:
        break;
    }
  }

  const timeline: Timeline = {
    metric: "commits",
    range,
    points,
  };

  return { username, summary, timeline };
}
