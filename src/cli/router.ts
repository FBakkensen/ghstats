import { Command } from "commander";
import { launchTUI } from "../tui/app";
import { getAuthenticatedUser } from "../infra/githubClient";
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
    .description("Show commit timeline for a range (daily bucket)")
    .option("--range <range>", "Range presets (7d,30d,90d,1y) or YYYY-MM-DD:YYYY-MM-DD", "30d")
    .action(async (opts) => {
      try {
        const range = parseRange(opts.range, "day");
        const { username, timeline } = await getStats(range);

        console.log(`User: ${username}`);
        console.log(`Commits timeline (daily)`);
        printTimeline(timeline);
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
