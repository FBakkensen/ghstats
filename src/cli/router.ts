import { Command } from "commander";
import { launchTUI } from "../tui/app";
import { getAuthenticatedUser } from "../infra/githubClient";

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
}
