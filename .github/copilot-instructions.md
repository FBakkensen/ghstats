# Copilot Instructions for `ghstats`

- NEVER run `npm` or `yarn` commands; use `bun` exclusively for package management and scripts.

- Repo status: currently only `docs/prd.md`; treat it as the source of truth. Do not invent APIs beyond what the PRD describes.
- Goal: Bun-based GitHub activity dashboard with both CLI and OpenTUI front-ends. Focus on personal GitHub stats (read-only).

## Stack & prereqs
- Runtime: Bun (TypeScript). Ensure Zig is available for OpenTUI native bindings.
- Key libs (planned): `@opentui/core`, `commander`, `date-fns`, `@octokit/graphql`, `@octokit/rest`.
- Auth: GitHub OAuth device flow (prompt in CLI/TUI); store token in config if user approves; scopes `repo` + `read:user`.

## Intended architecture (from PRD)
- Interface layer: CLI command router + OpenTUI views (overview, evolution, repos, repo detail, optional languages).
- Core services: stats aggregation, bucketing, transformers mapping GitHub data to domain models.
- Infra: GitHub client (REST+GraphQL, pagination, rate limit headers), file cache, config store, optional logger.
- Proposed layout: `src/cli`, `src/tui`, `src/core`, `src/infra`, `src/types`, `bin/ghstats` wrapper.

## Data & caching expectations
- Cache path: `~/.config/ghstats/cache/{entity}/{key}.json` (entities like events, commits, repos, languages).
- Config path: `~/.config/ghstats/config.json` with username, defaults (range, bucket), optional token reference.
- Behavior: prefer pure core functions; cache recent slices with TTL (~24h) and allow `--full` rebuilds.

## Planned CLI surface (v1)
- `ghstats` (launch TUI), `summary`, `timeline`, `repos`, `repo <owner/name>`, `config`, `refresh [--full]`.
- Range formats: presets `7d/30d/90d/1y` or `YYYY-MM-DD:YYYY-MM-DD`; bucket `day|week`; `--json` for machine-readable output.

## TUI behaviors to honor
- Overview: header, summary cards, commit/LOC sparklines, top repos.
- Evolution: chart selectable metric (commits/prs/loc/activeDays), bucket switch `d/w`, zoom/pan.
- Repos list: sortable table; repo detail shows per-repo stats + mini timeline + languages.
- Hotkeys (examples): range presets via number keys, `t` range chooser, `e` evolution, `R` repos, `L` languages, `r` refresh, `q` quit.

## Testing & workflows (planned)
- Tests: Vitest for core services/transformers; TUI manual for now.
- Workflows: use Bun scripts (add `bun test`/`bun run` equivalents when package.json exists). Prefer fixture-based API mocks for offline testing.

## Conventions
- Keep logic minimal and align with PRD; avoid speculative features or abstractions.
- Favor pure, deterministic core functions; surface rate-limit info and cache usage to the UI/CLI.
- Do not log tokens; prefer device-flow token from config, allow env override if provided.

## When adding code
- Start from the proposed structure; place features in the matching layer. Keep command outputs consistent between TUI and `--json` variants.
- Provide sensible defaults (range 30d, bucket day) and graceful handling of missing cache or rate limits.
