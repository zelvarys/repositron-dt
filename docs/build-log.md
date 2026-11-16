# Build log

## 2026-11-15 - Pivot to CLI

Scaffolded Ink and ported insights to run in-memory.

- Replaced the root package with an ESM CLI package named `repositron`.
- Added Node 22+ TypeScript, Vitest, and Ink configuration.
- Implemented GitHub Device Flow authentication with local config persistence.
- Ported repository, commit, content, workflow, and contributor fetching.
- Ported the 13 tool detectors to run in-memory.
- Added bus factor, commit activity, CI health, dependency parsing, and the
  repository health score.
- Added the interactive repository picker, scan progress screen, dashboard, and
  five tabs.
- Added ASCII progress bars and terminal colors.

## 2026-11-15 - Verification

Added Vitest coverage for tool adoption, bus factor and Gini math, activity
buckets and commit quality, CI aggregation, and dependency parsing. The suite
passes locally with type checking and a production build.

## 2026-11-16 - Repository filtering, dependency intelligence, UI refresh

- Limited the picker to owned repositories and repositories with commits or
  merged pull requests in the last 12 months.
- Added registry latest-version lookups, semver comparison, and OSV advisory
  aggregation to the dependency report.
- Rebuilt the UI around a shared theme, stat cards, sparklines, badges, a staged
  scanning checklist, and interactive dependency filtering.
- Added `REPOSITRON_ASCII=1` as a glyph fallback.
