# Architecture

Repositron is a local-first terminal application. It has no hosted backend,
database, or background worker; everything runs from the CLI on your machine.

## Runtime overview

```text
npx repositron
    |
    v
src/cli.ts
    |-- meow: parse --help, --version, --token
    |-- auth/check.ts: resolve credentials
    |       env -> saved config -> gh CLI -> device flow
    |-- validate the token with GET /user
    |-- render <App token username />
            |
            +-- RepoPicker
            |      GET /user/repos
            |      select repository
            |
            +-- Scanning
            |      scanRepository()
            |      fetch, detect, aggregate, report
            |
            +-- Dashboard
            |      tabs 1-5 and q/Esc
            |
            +-- Error
                   q/Esc back to the picker
```

`src/cli.ts` exits on authentication or render failures. React state drives the
screens; there is no router, server, database, or background worker.

## Boot and authentication

`src/auth/check.ts` resolves credentials in this order:

1. `GITHUB_TOKEN`, then `GH_TOKEN`
2. The token saved by `conf` at `~/.config/repositron/config.json`
3. The first `oauth_token` in `~/.config/gh/hosts.yml`
4. GitHub OAuth Device Flow

The CLI validates the resolved token with `GET /user`. If a saved or GitHub CLI
token is rejected, it clears the saved credentials and starts the device flow. An
invalid token supplied through the environment or `--token` fails immediately
instead of silently replacing it.

The device flow posts to `https://github.com/login/device/code` with the
`public_repo read:user read:org` scopes, prints the verification URL and user
code, opens the browser on a best-effort basis, and polls the token endpoint at
GitHub's requested interval. On success `src/auth/config.ts` writes the token
through `conf`. There is no client secret and no callback server.

`conf` owns the config file layout. The app only reads and writes three optional
keys: `token`, `username`, and `savedAt`.

## UI state machine

`src/ui/App.tsx` owns the top-level state:

```text
picker -> scanning -> dashboard
                    \-> error
picker <- dashboard
picker <- error
```

- `RepoPicker` fetches repositories on mount, filters them locally, and starts a
  scan when the user selects one. A `pending` flag prevents updates after
  unmount.
- `scanning` renders the progress callback from `scanRepository`.
- `dashboard` receives the completed `ScanResult` and handles tab state.
- `error` shows the failure message and returns to the picker on `q` or Esc.

`Dashboard` uses Ink's `useInput` for its key bindings. `RepoPicker` routes input
between its text field and `ink-select-input`: typing a letter moves focus to the
search field, Enter or Esc returns to the list. No screen prints emojis; status is
expressed with ASCII markers such as `[OK]`, `[--]`, and `[####----]`.

The Header, StatusMessage, and ProgressBar components are shared across screens.
Chalk provides terminal colors while Ink handles layout, borders, and live
rendering.

## Scan pipeline

`src/scan.ts` is the boundary between network I/O and pure insight logic.

1. Fetch contributors, commit history, and root contents in parallel.
2. Build the commit history and keep the 30 newest commits for diff lookups.
3. Fetch commit details concurrently, five at a time.
4. Fetch known root config files from `CONFIG_FILE_CANDIDATES` and
   `CONFIG_SUBDIR_CANDIDATES`.
5. Fetch `.github/workflows`, read each workflow file, and fetch workflow runs.
6. Build a `ScanContext`, run the detectors and aggregators, and return
   `{ repo, context, report }`.

Hard limits keep the scan bounded:

| Data | Limit |
| --- | --- |
| Commit detail lookups | 30 |
| Commit pages | 5 (500 commits) |
| Contributor pages | 2 (200 contributors) |
| Workflow run pages | 3 (300 runs) |
| Commit detail concurrency | 5 |
| Activity history | 365 days |

`src/github/client.ts` adds the token, GitHub API version header, a 20 second
timeout, and typed errors for authentication, rate limits, and timeouts.
`src/github/fetch.ts` handles pagination and content decoding. `src/github/repos.ts`
contains the repository list and detail calls.

## Pure insight layer

Everything under `src/insights/` is synchronous and in-memory. It receives a
`ScanContext` and returns plain objects:

- `tools.ts` runs 13 detectors and builds `RepoMetrics`.
- `bus-factor.ts` computes contributor shares and the Gini coefficient.
- `activity.ts` builds daily, weekly, weekday, hour, author, and commit-quality
  aggregates.
- `ci.ts` aggregates workflow runs and filters by workflow, branch, and time.
- `dependencies.ts` parses manifests locally. It explicitly does not call
  registries, OSV, or advisory APIs.
- `health.ts` combines activity, CI, contributor spread, and commit quality into
  a weighted score when the underlying data is available.

This separation keeps tests fast and means the UI never parses GitHub payloads or
performs metric arithmetic. See [insights.md](insights.md) for formulas and
limitations.

## Storage and security

Repositron stores only the GitHub token and optional username locally. There is
no repository data cache, scan history, or telemetry. The token is written to the
user config directory by `conf`; its protections are the operating system account
and file permissions. Use a dedicated token with the minimum scopes required, and
prefer the saved device-flow session over pasting long-lived tokens into shell
history.
