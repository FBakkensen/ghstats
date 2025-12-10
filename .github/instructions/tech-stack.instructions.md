---
applyTo: '**'
---
Provide a concise project tech stack for contributors and automation.

Tech stack (concise):

- Runtime: Bun (TypeScript) — Bun is required; do not fall back to npm/node
- Language: TypeScript
- CLI: commander
- TUI: @opentui/core (native bindings may require Zig)
- GitHub APIs: @octokit/rest and @octokit/graphql
- Dates: date-fns
- Cache/config: file-based under XDG (`~/.config/ghstats`)
- Testing: `bun:test` (Bun's native test runner, Jest-compatible)

Recommended layout (brief): bin/ghstats, src/{cli,tui,core,infra,types}

Docs (Context7 MCP):

- For external library docs, call Context7 MCP: 1) resolve-library-id with the package name, then 2) get-library-docs using the returned Context7 ID. Use `mode: "code"` for API examples and `mode: "info"` for conceptual guidance. If you already have an exact Context7 ID (`/org/project` or `/org/project/version`) you may skip the resolver.

Keep this file minimal and update only when the project's primary runtime or libraries change.