/**
 * GitHub auth helpers for Phase 0
 *
 * Phase 0 uses environment tokens only. No device flow or config storage.
 */

const tokenSources = [
  () => Bun.env.GITHUB_TOKEN,
  () => Bun.env.GH_TOKEN,
  () => process.env.GITHUB_TOKEN,
  () => process.env.GH_TOKEN,
];

/**
 * Retrieve the GitHub token from the environment.
 * Token must have at least repo + read:user scopes.
 */
export function getEnvToken(): string {
  for (const source of tokenSources) {
    const value = source();
    if (value) return value;
  }

  throw new Error(
    "GitHub token not found. Set GITHUB_TOKEN or GH_TOKEN with repo and read:user scopes."
  );
}
