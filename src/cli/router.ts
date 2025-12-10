import { Command } from "commander";
import { launchTUI } from "../tui/app";
import { getAuthenticatedUser, getUserEventsInRange } from "../infra/githubClient";
import { parseRange } from "../core/bucketing";
import { getStats } from "../core/statsService";
import type { Timeline } from "../types/domain";

export async function setupRouter(program: Command) {
  // Default action: launch TUI
  program.action(async () => {
    await launchTUI();
  });

  program
    .command("whoami")
    .description("Display the authenticated GitHub user (uses env token)")
    .action(async () => {
      try {
        const user = await getAuthenticatedUser();
        console.log(`Authenticated as: ${user}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Failed to fetch authenticated user:", message);
        process.exit(1);
      }
    });

  program
    .command("summary")
    .description("Show commit and PR summary for a range (daily bucket)")
    .option("--range <range>", "Range presets (7d,30d,90d,1y) or YYYY-MM-DD:YYYY-MM-DD", "30d")
    .action(async (opts) => {
      try {
        const range = parseRange(opts.range, "day");
        const { username, summary } = await getStats(range);

        const from = range.from.toISOString().slice(0, 10);
        const to = range.to.toISOString().slice(0, 10);

        console.log(`User: ${username}`);
        console.log(`Range: ${from} → ${to} (daily)`);
        console.log(`Commits: ${summary.commits}`);
        console.log(`PRs opened: ${summary.prsOpened}`);
        console.log(`PRs merged: ${summary.prsMerged}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Failed to compute summary:", message);
        process.exit(1);
      }
    });

  program
    .command("timeline")
    .description("Show commit timeline for a range")
    .option("--range <range>", "Range presets (7d,30d,90d,1y) or YYYY-MM-DD:YYYY-MM-DD", "30d")
    .option("--bucket <bucket>", "Bucket size (day|week)", "day")
    .option("--debug-events", "Print raw event counts for the range", false)
    .action(async (opts) => {
      try {
        const bucket = opts.bucket === "week" ? "week" : "day";
        const range = parseRange(opts.range, bucket);
        const { username, timeline } = await getStats(range);

        console.log(`User: ${username}`);
        console.log(`Commits timeline (${range.bucket})`);
        printTimeline(timeline);

        if (opts.debugEvents) {
          const events = await getUserEventsInRange(username, range);
          const byType = new Map<string, number>();
          for (const ev of events) {
            const key = ev.type ?? "unknown";
            byType.set(key, (byType.get(key) ?? 0) + 1);
          }

          console.log("\n[debug] Raw events fetched:", events.length);
          console.log("[debug] Event counts by type:");
          for (const [type, count] of byType.entries()) {
            console.log(`  ${type}: ${count}`);
          }

          if (events.length) {
            const filtered = events.filter((e) => !!e.created_at);
            const sorted = filtered.sort(
              (a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
            );
            console.log(
              `[debug] Oldest event: ${sorted[0].type} @ ${sorted[0].created_at}, ` +
                `Newest: ${sorted[sorted.length - 1].type} @ ${sorted[sorted.length - 1].created_at}`
            );
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Failed to compute timeline:", message);
        process.exit(1);
      }
    });
}

function printTimeline(timeline: Timeline) {
  for (const point of timeline.points) {
    console.log(`${point.date}: ${point.value}`);
  }
}
