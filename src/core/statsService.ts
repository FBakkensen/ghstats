import { formatISO, startOfDay, startOfISOWeek } from "date-fns";
import { initPoints } from "./bucketing";
import { getAuthenticatedUser, getUserEventsInRange } from "../infra/githubClient";
import type { Bucket, SummaryStats, TimeRange, Timeline } from "../types/domain";

export interface StatsBundle {
  username: string;
  summary: SummaryStats;
  timeline: Timeline;
}

function bucketKey(dateString: string, bucket: Bucket): string {
  const date = new Date(dateString);
  const bucketStart = bucket === "week" ? startOfISOWeek(date) : startOfDay(date);
  return formatISO(bucketStart, { representation: "date" });
}

function countCommits(event: any): number {
  if (typeof event?.payload?.distinct_size === "number") return event.payload.distinct_size;
  if (typeof event?.payload?.size === "number") return event.payload.size;
  if (Array.isArray(event?.payload?.commits)) return event.payload.commits.length;
  return 0;
}

export async function getStats(range: TimeRange): Promise<StatsBundle> {
  const username = await getAuthenticatedUser();
  const events = await getUserEventsInRange(username, range);

  const points = initPoints(range);
  const pointIndex = new Map(points.map((p) => [p.date, p]));

  const summary: SummaryStats = {
    range,
    commits: 0,
    prsOpened: 0,
    prsMerged: 0,
  };

  for (const event of events) {
    if (!event.created_at) continue;
    const key = bucketKey(event.created_at, range.bucket);
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
