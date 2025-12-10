import { Octokit } from "@octokit/rest";
import { getEnvToken } from "./auth";

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

