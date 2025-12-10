import { Octokit, type RestEndpointMethodTypes } from "@octokit/rest";
import { getEnvToken } from "./auth";
import type { TimeRange } from "../types/domain";

/**
 * Create an authenticated Octokit client using env token only.
 */
export function getOctokitClient(): Octokit {
  const token = getEnvToken();
  return new Octokit({
    auth: token,
    userAgent: "ghstats/0.1.0",
  });
}

/**
 * Fetch the authenticated GitHub user's login.
 */
export async function getAuthenticatedUser(): Promise<string> {
  const octokit = getOctokitClient();

  try {
    const { data } = await octokit.rest.users.getAuthenticated();
    return data.login;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch authenticated user: ${message}`);
  }
}

type UserEvent =
  RestEndpointMethodTypes["activity"]["listEventsForAuthenticatedUser"]["response"]["data"][number];

function isWithinRange(dateString: string, range: TimeRange): boolean {
  const ts = new Date(dateString).getTime();
  return ts >= range.from.getTime() && ts <= range.to.getTime();
}

/**
 * Fetch authenticated user's events within the provided range.
 * Uses the Activity events feed (descending by time) and stops early once
 * events are older than the range start to keep calls small.
 */
export async function getUserEventsInRange(
  username: string,
  range: TimeRange,
  maxPages = 10
): Promise<UserEvent[]> {
  const octokit = getOctokitClient();
  const events: UserEvent[] = [];

  try {
    let page = 0;
    for await (const response of octokit.paginate.iterator(
      octokit.rest.activity.listEventsForAuthenticatedUser,
      {
        username,
        per_page: 100,
      }
    )) {
      page += 1;
      let shouldStop = false;

      for (const event of response.data) {
        if (new Date(event.created_at) < range.from) {
          shouldStop = true;
          break;
        }

        if (isWithinRange(event.created_at, range)) {
          events.push(event);
        }
      }

      if (shouldStop || page >= maxPages) {
        break;
      }
    }

    return events;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch user events: ${message}`);
  }
}

