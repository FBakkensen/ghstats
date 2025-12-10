# Product Requirements Document – `ghstats`

_Last updated: 2025-12-10_
_Status: Draft_

---

## 1. Overview

**Working name:** `ghstats`
**Tagline:** A GitHub activity dashboard in your terminal.

`ghstats` is a Bun-based CLI + OpenTUI application that visualizes your
personal GitHub activity over time: commits, PRs, issues, reviews, lines
of code, repositories, and languages. It focuses on **statistics and
evolution** of your work, with no distinction between AI‑generated and
non‑AI‑generated code.

---

## 2. Goals & Non-goals

### 2.1. Goals (v1)

1. Provide a **visual timeline** of GitHub activity (daily/weekly).
2. Offer a **dashboard** summarizing contributions for configurable time
   ranges (for example 7, 30, 90 days, 1 year, custom).
3. Enable **breakdowns by repository and language** for a given period.
4. Support both:
   - **Interactive TUI** (OpenTUI) for exploration.
   - **Scriptable CLI** (JSON/text) for automation.
5. Keep setup friction low (simple GitHub auth, sensible defaults).
6. Cache data locally for **fast repeated use** and reduced API calls.

### 2.2. Non-goals (v1)

- No differentiation between AI vs non‑AI contributions.
- No “before/after AI adoption” analysis.
- No team/org‑level analytics (single authenticated user only).
- No support for non‑GitHub platforms in v1.
- No automated actions on GitHub (read‑only access only).

---

## 3. Target Users

- **Primary:** Individual developers who want to:
  - See how their GitHub activity evolves over time.
  - Understand where they spend their time (repos, languages).
  - Use a lightweight, local TUI instead of browser dashboards.

- **Secondary (future):**
  - Power users who want AI‑assisted summaries or chat over their stats.
  - People who want to export periodic activity reports.

---

## 4. Key Concepts & Metrics

### 4.1. Time Series (“Evolution”)

Aggregated by **day** or **week**:

- Commits count
- PRs opened
- PRs merged
- Issues opened
- Reviews written
- Lines added (approximate)
- Lines removed (approximate)
- Active days (boolean per day; used for streaks/trends)

**Visual forms (TUI):**

- ASCII line charts / bar charts (sparklines) over time.
- Optional intensity/streak rows (for example light to dark blocks per
  day).

### 4.2. Period Summaries

For any selected time range:

- Total commits
- Total PRs opened / merged
- Total issues opened
- Total reviews
- Lines added / removed
- Number of active days
- Average per‑day / per‑week metrics (for example commits/week)

### 4.3. Breakdowns

For a selected time range:

- **By repository**
  - Commits, PRs, issues, LOC added/removed per repo.
- **By language**
  - Aggregated language distribution using GitHub language stats per
    repo, weighted by your activity in those repos.

---

## 5. User Stories

### 5.1. MVP

1. As a user, I can see a **summary dashboard** for my last 30 days of
   activity: commits, PRs, issues, reviews, LOC.
2. As a user, I can see a **timeline of my commits** over the last N
   days/weeks in the TUI.
3. As a user, I can see how **lines added/removed** evolve over time.
4. As a user, I can see **which repositories** I worked on most in a
   chosen time window.
5. As a user, I can see my **language usage breakdown** for a period.
6. As a user, I can run:
   - `ghstats summary --range 30d --json`
     and receive a machine‑readable summary.
7. As a user, I can configure GitHub auth once and then use `ghstats`
   without repeated prompts.

### 5.2. Post‑MVP / Nice-to-have

1. See streaks:
   - Longest active streak.
   - Current active streak.
2. See simple “trend” indicators:
   - This period vs previous period (for example `+20 %` commits).
3. Export reports:
   - Markdown/CSV for a given time range.
4. Additional visualizations:
   - Activity heatmaps by weekday.

---

## 6. Features

### 6.1. Authentication & Configuration

**Auth sources:**

- Primary: `GITHUB_TOKEN` or `GH_TOKEN` environment variables.
- Optional: store configuration in a file (no requirement to store
  tokens, but allowed if user opts in).

**Config file location (example):**

- `~/.config/ghstats/config.json`

**Config contents (conceptual type):**

- `Config`:
  - `username: string`
  - `defaultRange?: string` (for example `"30d"`)
  - `defaultBucket?: "day" | "week"`
  - Future: token reference or additional prefs

**Command: `ghstats config`**

- Prompts for:
  - GitHub username (if not known).
- Checks for token in environment.
- Optionally allows user to persist token (if they choose).
- Verifies credentials via a simple GitHub API request.
- Token scopes:
  - Required: `repo` (private repo access), `read:user` (profile info).
  - `gh auth token` is compatible; document how to export to env.

### 6.2. Data Collection & Caching

**Sources (GitHub API):**

- User events / contributions:
  - Commits (via associated PRs or repos).
  - Pull requests opened/merged.
  - Issues opened.
  - Reviews.
- Repositories user has contributed to.
- Commit stats for LOC:
  - Approximate additions and deletions via commit stats or PR diffs.
- Repo languages:
  - GitHub language stats endpoint.

**Caching:**

- Cache location:
  - `~/.config/ghstats/cache/`
- Cached items:
  - Raw API responses (per repo, per time slice where possible).
- Format and layout:
  - JSON files per entity/time slice for debuggability.
  - Path pattern: `~/.config/ghstats/cache/{entity}/{key}.json`.
  - Example entities: `events`, `commits`, `repos`, `languages`.
- Behavior:
  - First run may fetch a significant amount of data.
  - Subsequent runs rely on cache and only update recent data.
  - Invalidation:
    - Recent slices: TTL-based refresh (for example 24h).
    - Historical slices: kept permanently unless `--full` refresh.
- Commands:
  - `ghstats refresh`
    - Refresh recent cached data.
  - `ghstats refresh --full`
    - Rebuild cache more deeply (slower).

**Rate limits:**

- The app should:
  - Track GitHub rate limit headers.
  - Display remaining quota and reset times (in TUI and/or CLI output).
  - Fail gracefully when rate‑limited.

### 6.3. TUI (OpenTUI) Views

#### 6.3.1. Overview Dashboard (Default)

**Purpose:**
High‑level snapshot of your activity in the selected range.

**Content:**

- Header:
  - Username.
  - Selected time range.
  - Last sync time.
- Summary cards:
  - Commits.
  - PRs opened / merged.
  - Issues opened.
  - Reviews.
  - Lines added / removed.
- Mini charts:
  - Commits per day (sparkline).
  - LOC added per day (sparkline).
- Top repositories list (3–5):
  - Repo name.
  - Commits / PRs / LOC for the period.

**Interactions:**

- Arrow keys or keys like `1`, `2`, `3`, `4` to change range presets:
  - `7d`, `30d`, `90d`, `1y`.
- `t` – open time range chooser for custom `from/to` dates.
- `e` – open Evolution view.
- `R` – open Repositories view.
- `L` – open Languages view (if implemented).
- `r` – refresh data.
- `q` – quit.

#### 6.3.2. Evolution View (Timeline Focus)

**Purpose:**
Show how activity evolves over time.

**Content:**

- Main chart:
  - Selectable metric:
    - `commits`, `prs`, `loc`, `activeDays`.
  - X-axis: time buckets (day or week).
  - Y-axis: chosen metric.
- Optional secondary chart:
  - Lines added vs removed as bars.

**Interactions:**

- `e` – go to Evolution view from anywhere.
- `m` – cycle metric (commits → PRs → LOC → active days).
- `d` / `w` – switch bucket size (daily/weekly).
- `+` / `-` – zoom in/out (shorter/longer range).
- Arrow keys – pan in time if range is larger than visible window.
- `Esc` / `q` – back to Overview or quit.

#### 6.3.3. Repositories View

**Purpose:**
Show where you spend your time.

**Content:**

- Table of repos for selected time range:
  - Repo name (`owner/name`).
  - Commits.
  - PRs.
  - Issues.
  - LOC added.
  - LOC removed.
- Sortable by:
  - Commits (default), PRs, LOC, name.

**Interactions:**

- `R` – go to Repositories view.
- Arrow keys – navigate table rows.
- `Tab` / `Shift+Tab` – move between columns / sort controls.
- `Enter` – open Repo Detail view for selected repo.
- `b` / `Esc` – back to Overview.

#### 6.3.4. Repo Detail View

**Purpose:**
Drill down into a single repo.

**Content:**

- Summary:
  - Commits, PRs, issues, LOC added/removed for selected period.
- Mini timeline:
  - Commits or LOC over time for this repo only.
- Languages:
  - Language breakdown for this repo (from GitHub API).

**Interactions:**

- `Enter` from Repositories view to enter.
- `m` – toggle main metric charted (commits/LOC).
- `b` / `Esc` – back to Repositories view.

#### 6.3.5. Languages View (Optional in MVP)

**Purpose:**
Show language distribution over a period.

**Content:**

- Aggregated language distribution:
  - Approximate % per language (TypeScript, Go, Python, etc.).
- Representation:
  - Text bar chart or compact table, for example:

    - `TypeScript 45 %  #######`
    - `Go        30 %  #####`
    - `Python    15 %  ###`
    - `Other     10 %  ##`

**Interactions:**

- `L` – open Languages view.
- `b` / `Esc` – back to Overview.

### 6.4. CLI Commands (Headless Mode)

1. `ghstats`
   Launch interactive TUI (Overview by default).

2. `ghstats summary [--range <range>] [--bucket (day|week)] [--json]`

   - Range formats:
     - Presets: `7d`, `30d`, `90d`, `1y`.
     - Explicit: `YYYY-MM-DD:YYYY-MM-DD`.
   - Output:
     - Default: human‑readable summary.
     - With `--json`: structured `SummaryStats` object.

3. `ghstats timeline [--metric commits|prs|loc|active-days] [--range <range>] [--bucket day|week] [--json]`

   - Returns a time series for the selected metric.
   - `--json` prints array of `{ date, value }`.

4. `ghstats repos [--range <range>] [--limit N] [--json]`

   - Lists repos and key stats.
   - Sort order:
     - Commits descending by default.

5. `ghstats repo <owner/name> [--range <range>] [--json]`

   - Detailed stats for a single repo.

6. `ghstats config`

   - Runs config wizard (username, token hints).

7. `ghstats refresh [--full]`

   - Refreshes cached data.
   - `--full` runs a deeper, more expensive sync.

---

## 7. Data & Domain Model

### 7.1. Types (Conceptual)

Conceptual TypeScript-like definitions (no actual code blocks):

- `Bucket`:
  - `"day"` or `"week"`

- `TimeRange`:
  - `from: Date`
  - `to: Date`
  - `bucket: Bucket`

- `TimePoint`:
  - `date: string` (ISO start of bucket)
  - `value: number`

- `TimelineMetric`:
  - `"commits" | "prs" | "loc" | "activeDays"`

- `Timeline`:
  - `metric: TimelineMetric`
  - `range: TimeRange`
  - `points: TimePoint[]`

- `SummaryStats`:
  - `range: TimeRange`
  - `commits: number`
  - `prsOpened: number`
  - `prsMerged: number`
  - `issuesOpened: number`
  - `reviews: number`
  - `linesAdded: number`
  - `linesRemoved: number`
  - `activeDays: number`

- `RepoStats`:
  - `repo: string` (for example `"owner/name"`)
  - `commits: number`
  - `prs: number`
  - `issues: number`
  - `linesAdded: number`
  - `linesRemoved: number`

- `LanguageShare`:
  - `language: string`
  - `percentage: number` (0–100)

---

## 8. Architecture

### 8.1. High-level Architecture

Layers:

1. **Interface Layer (CLI & TUI)**
   - CLI command routing.
   - OpenTUI views and components.

2. **Core Domain & Services Layer**
   - Aggregation of stats, time‑bucketing, business rules.
   - Functions like “get summary for this time range” or “get timeline”.

3. **Infrastructure Layer**
   - GitHub API client.
   - Cache management.
   - Config management.
   - Logging (optional).

The core services should be pure where possible (input: raw events,
output: domain models) to keep them testable and reusable (for example
by future AI/chat features).

### 8.2. Project Structure (Proposed)

Textual tree (no inner code fences):

- `src/`
  - `cli/`
    - `index.ts`           – entrypoint for CLI
    - `router.ts`          – command routing
    - `commands/`
      - `summary.ts`
      - `timeline.ts`
      - `repos.ts`
      - `repo.ts`
      - `config.ts`
      - `refresh.ts`
  - `tui/`
    - `app.ts`             – OpenTUI app launcher
    - `views/`
      - `overviewView.ts`
      - `evolutionView.ts`
      - `reposView.ts`
      - `repoDetailView.ts`
      - `languagesView.ts`
    - `components/`
      - `charts/`
        - `lineChart.ts`
        - `barChart.ts`
        - `sparkline.ts`
      - `layout/`
        - `header.ts`
        - `footer.ts`
        - `summaryCards.ts`
  - `core/`
    - `statsService.ts`    – orchestrates data for summaries, timelines, repos
    - `bucketing.ts`       – time bucketing and aggregation logic
    - `transformers.ts`    – map raw GitHub data to domain models
  - `infra/`
    - `githubClient.ts`    – REST/GraphQL client, rate-limit handling
    - `cache.ts`           – file-based cache utilities
    - `configStore.ts`     – read/write config file
    - `logger.ts`          – optional logging
  - `types/`
    - `domain.ts`          – shared domain types

- `bin/`
  - `ghstats`              – small wrapper calling `src/cli/index.ts`

- `package.json`
- `bunfig.toml`

### 8.3. Data Flow

1. CLI or TUI requests data
   - For example user runs `ghstats summary --range 30d` or opens the
     Overview view.

2. Core service invoked
   - `statsService.getSummary(range)` or similar.
   - It:
     - Determines which raw data is needed.
     - Asks `githubClient` for data (going through `cache`).
     - Aggregates results (via `bucketing` and `transformers`).

3. Infrastructure layer
   - `githubClient`:
     - Handles HTTP via Bun `fetch`.
     - Manages pagination and rate-limit headers.
   - `cache`:
     - Checks if requested data exists in cache.
     - Reads from disk or fetches and then writes to disk.
   - `configStore`:
     - Provides username, default ranges, token reference.

4. Response to interface layer
   - CLI:
     - Converts domain models to pretty text or JSON.
   - TUI:
     - Uses domain models to render charts and tables.

### 8.4. Technology Choices

- **Runtime:** Bun
  - Fast startup, good for CLI tools.
- **Language:** TypeScript
  - Strong typing for domain and API models.
- **TUI Framework:** OpenTUI (`@opentui/core`, imperative API) [github.com/sst/opentui](https://github.com/sst/opentui)
  - For layout, widgets, keyboard handling.
- **CLI parsing:** `commander`
- **Date handling:** `date-fns`
- **HTTP:** Bun `fetch`, wrapped in `githubClient`.
- **GitHub API clients:**
  - Mixed approach: GraphQL via `@octokit/graphql` for bulk queries.
  - REST via `@octokit/rest` for simple endpoints.

### 8.5. Dependencies

Initial `package.json` dependencies:

- `@opentui/core`
- `commander`
- `date-fns`
- `@octokit/graphql`
- `@octokit/rest`

### 8.6. Prerequisites

- Bun >= 1.0.
- Zig installed (required by OpenTUI native bindings).
- GitHub personal access token with `repo` and `read:user` scopes.

### 8.7. Testing Strategy

- Unit tests: Vitest for core services/transformers.
- TUI testing: manual verification for v1.
- API mocking: fixture-based for offline development.

### 8.8. Non-functional Requirements

- **Performance:**
  - Initial sync may be slower; display progress.
  - Subsequent runs should primarily hit cache.
- **Resilience:**
  - Handle network errors and rate limits gracefully.
  - Show partial results where possible.
- **Security:**
  - Do not log tokens.
  - Allow “env only” mode for tokens.
- **Portability:**
  - Support macOS, Linux, WSL.
  - Windows native support desirable but not mandatory for v1.

---

## 9. Future: AI-powered Features (Non-MVP)

These are **out of scope for v1**, but the architecture should enable
them by exposing clean, structured stats and JSON output.

### 9.1. AI Chat over Stats

**Goal:** Natural‑language querying of your stats.

Examples:

- `ghstats chat`
  - User: “What were my three most active repos this quarter?”
  - User: “When did my LOC changes spike?”

Approach:

- Export compact stats snapshot (summaries, timelines, top repos).
- Provide to an LLM with user’s question.
- Return textual answer and, optionally, suggested CLI commands.

### 9.2. AI-written Summaries and Reports

**Goal:** Turn raw stats into short narratives.

Examples:

- `ghstats summary --range 7d --explain`
  - Stats plus a short explanation of what changed.
- `ghstats report --range 30d --format markdown`
  - Narrative summary ready to drop into a journal or review.

### 9.3. Agent-like Automation

**Goal:** Optional scheduled reporting.

- User can configure periodic jobs that:
  - Generate a report.
  - Save to disk or to a designated repo.
- Requires explicit opt‑in and clear explanation of what’s done.

---

## 10. Milestones & Phases

### Phase 0 – Skeleton & Spike

- Set up Bun project and `bin/ghstats`.
- Integrate OpenTUI with a minimal “Hello world” screen.
- Implement `githubClient` test to fetch and display username.

### Phase 1 – Core Stats & Basic CLI

- Implement:
  - `githubClient` base calls (auth, simple queries).
  - `statsService` for commits + PRs.
  - Basic daily time-bucketing.
- Implement `ghstats summary` (text only).
- Implement `ghstats timeline` for commits.

### Phase 2 – TUI Overview & Evolution

- Implement Overview view:
  - Summary cards.
  - Commit sparkline.
- Implement Evolution view:
  - Commits over time chart.
  - Daily/weekly switching.
- Add range switching in TUI.

### Phase 3 – Repos, LOC & Caching

- Fetch per‑commit stats for LOC approximations.
- Implement Repositories and Repo Detail views.
- Implement caching and `ghstats refresh`.

### Phase 4 – Polish & Extras

- Add JSON outputs for main commands.
- Add (optional) Languages view.
- Improve charts, navigation, and error handling.
- Add docs and screenshots/gifs of the TUI.

---