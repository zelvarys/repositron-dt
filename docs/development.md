# Development

## Requirements

- Node.js 22 or newer
- npm
- A GitHub account

The CLI has no external service or environment file requirement.

## Setup

```sh
git clone https://github.com/zelvarys/repositron.git
cd repositron
npm install
```

## Run locally

```sh
npm run dev
```

`npm run dev` runs `tsx src/cli.ts` without a build. The first run uses the
authentication chain described in [architecture.md](architecture.md) and may start
the GitHub device flow.

To run the compiled entry point:

```sh
npm run build
node dist/cli.js
```

## Authentication while developing

The device flow is the normal path:

```sh
npm run dev
```

For faster iteration, use a personal access token instead:

```sh
GITHUB_TOKEN=github_pat_xxx npm run dev
```

or:

```sh
npm run dev -- --token github_pat_xxx
```

The `--token` flag is for local testing. It is intentionally not saved by the CLI.
`GITHUB_TOKEN` and `GH_TOKEN` are also read without writing to disk. If the token
is invalid, the CLI reports the failure instead of starting a device flow over a
token you supplied explicitly.

Use a fine-grained token with read access to the repositories you want to test, or
a classic token with `public_repo`, `read:user`, and `read:org` for public
repositories.

To inspect or remove the saved session:

```sh
cat ~/.config/repositron/config.json
rm -rf ~/.config/repositron
```

## Tests

```sh
npm test
```

The Vitest suite only includes `tests/**/*.test.ts`. The current coverage targets
the pure logic:

- `tests/tools.test.ts`: mock `ScanContext` and detector adoption.
- `tests/bus-factor.test.ts`: shares, Gini coefficient, and risk thresholds.
- `tests/activity.test.ts`: weekly buckets, range selection, and commit quality.
- `tests/ci.test.ts`: workflow aggregation and filtering.
- `tests/dependencies.test.ts`: manifest parsing and summaries.

Watch mode:

```sh
npm run test:watch
```

## Type checking and build

```sh
npm run typecheck
npm run build
```

The build writes ESM JavaScript and declarations to `dist/`. The published binary
is `dist/cli.js` through the `bin` field in `package.json`.

## Package layout

```text
src/cli.ts                 meow entry point and auth boot
src/auth/                  config storage, device flow, credential resolution
src/github/                API client and paginated fetch helpers
src/insights/              pure detectors, aggregates, scores, and types
src/scan.ts                network orchestration and report assembly
src/ui/                    Ink app, screens, tabs, and shared components
tests/                     Vitest coverage for the pure logic
```

## Adding a detector

1. Add a `ToolDetector` implementation under `src/insights/detectors/`.
2. Keep `detect(ctx)` synchronous. It must not perform network or filesystem I/O.
3. Register the detector in `src/insights/tools.ts`.
4. Add any required root config paths to `CONFIG_FILE_CANDIDATES` or
   `CONFIG_SUBDIR_CANDIDATES` in `src/scan.ts`.
5. Add language relevance in `isToolRelevant()` if the tool is ecosystem-specific.
6. Add tests with a mock `ScanContext` covering detected, not detected, and
   adoption behavior.
7. Update the detector table in [insights.md](insights.md).

## Submitting changes

- Run `npm run typecheck`, `npm test`, and `npm run build` before opening a pull
  request.
- Keep pure insight changes separate from UI changes where practical.
- Do not add a database, server, or background worker to the CLI.
- Do not print emojis in terminal output. Use ASCII markers and colors.
- Do not commit tokens, personal access tokens, or `~/.config/repositron`.
