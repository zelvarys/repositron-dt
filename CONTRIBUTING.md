# Contributing to Repositron

Thanks for taking the time to contribute.

## Ways to contribute

- **Bug reports**: open an issue with reproduction steps and terminal output.
- **New detectors**: see `docs/development.md` for the detector workflow.
- **Language support**: detectors for Rust, Ruby, Java, Kotlin, C#, and others
  are welcome.
- **TUI improvements**: keyboard navigation, layout, and accessibility.
- **Documentation**: usage examples, metric explanations, and platform notes.

## Development setup

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm run dev` to start the CLI with `tsx`.
4. Run `npm test` to confirm the suite is green.

There is no external service or `.env` requirement. See
`docs/development.md` for using a personal access token during development.

## Adding a detector

1. Read `docs/insights.md` for the metric definitions and limitations.
2. Create `src/insights/detectors/<tool>.detector.ts`.
3. Implement `ToolDetector`: `name`, `category`, and synchronous `detect(ctx)`.
4. Register it in `src/insights/tools.ts`.
5. Add config paths to `src/scan.ts` if the detector needs files that are not
   already fetched.
6. Add language relevance in `isToolRelevant()` when appropriate.
7. Add unit tests in `tests/` with a mock `ScanContext`: cover config detection,
   dependency detection, workflow detection, a negative case, and per-contributor
   adoption.
8. Update the detector table in `docs/insights.md`.

## Commit conventions

Use Conventional Commits:

- `feat(detectors): add Rust Clippy detector`
- `fix(metrics): handle empty contributor lists`
- `test(activity): cover weekly bucket boundaries`
- `docs(insights): document the Gini calculation`

Keep changes focused. Pure insight changes, UI changes, tests, and documentation
are easiest to review as separate commits.

## Code style

- TypeScript strict mode, ESM, and `.js` extensions in relative imports.
- Keep `src/insights/` synchronous and free of network or filesystem I/O.
- Prefer Ink components and Chalk colors over manual terminal escape sequences.
- No emojis in CLI output. Use ASCII markers such as `[OK]`, `[--]`, and
  `[####----]`.
- Do not add a server, database, or background worker to the CLI.
- Do not commit tokens, credentials, or `~/.config/repositron`.

## Pull request checklist

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Detector additions include unit tests and documentation
- [ ] No secrets or credentials are included
- [ ] Terminal output remains ASCII-only and readable without color
