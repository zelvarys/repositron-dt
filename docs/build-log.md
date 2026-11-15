# Build log

## 2026-11-15 - Pivot to CLI

Archived the web app to `legacy/`, scaffolded Ink, ported insights to run
in-memory.

- Moved the Express API, BullMQ worker, Postgres migrations, React frontend,
  Docker files, and legacy tests into `legacy/`.
- Replaced the root package with an ESM CLI package named `repositron`.
- Added Node 22+ TypeScript, Vitest, and Ink configuration.
- Implemented GitHub Device Flow authentication with local config persistence.
- Ported repository, commit, content, workflow, and contributor fetching.
- Ported the 13 tool detectors without Redis or database dependencies.
- Added bus factor, commit activity, CI health, dependency parsing, and the
  repository health score.
- Added the interactive repository picker, scan progress screen, dashboard, and
  five tabs.
- Replaced web styling with ASCII progress bars and terminal colors.

## 2026-11-15 - Verification

Added Vitest coverage for tool adoption, bus factor and Gini math, activity
buckets and commit quality, CI aggregation, and dependency parsing. The suite
passes locally with type checking and a production build.
