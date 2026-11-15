<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="Repositron terminal prompt mark">
</p>

<h1 align="center">Repositron</h1>

<p align="center">An interactive terminal dashboard for GitHub repository health.</p>

Repositron is a local-first CLI. It logs in to GitHub once, lets you pick one of
your repositories, scans it on demand, and presents adoption, activity, bus
factor, dependency, and CI insights in a keyboard-driven terminal UI. There is no
database, hosted backend, or worker to run.

## Quick start

Requires Node.js 22 or newer.

```sh
npx repositron
```

On first run Repositron starts GitHub's OAuth Device Flow:

1. It opens GitHub in your browser.
2. Enter the short code shown in the terminal.
3. Authorize the request. The token is stored locally for next time.

The app then shows your repositories. Select one with the arrow keys and press
Enter to scan it.

## Authentication

Repositron checks credentials in this order:

1. `GITHUB_TOKEN` or `GH_TOKEN`
2. The saved session at `~/.config/repositron/config.json`
3. The GitHub CLI config at `~/.config/gh/hosts.yml`
4. GitHub OAuth Device Flow

The device flow requests `public_repo`, `read:user`, and `read:org` scopes. It
uses GitHub's public client ID by default; set
`REPOSITRON_GITHUB_CLIENT_ID` or `GITHUB_CLIENT_ID` to use your own OAuth app.
For local testing, `repositron --token <token>` accepts a personal access token
without saving it.

No token is sent anywhere except the GitHub API. The saved token lives in your
user config directory, protected by your operating system account permissions.

## Screenshots

### Repository picker

```text
+------------------------------------------------------------------------------+
| Repositron | GitHub repository dashboard                               @octocat |
+------------------------------------------------------------------------------+
| Select a repository                                                          |
| Type or press / to search. Up/Down to move. Enter to scan.                   |
|                                                                              |
| Search: (all repositories)                                                   |
| > octocat/widget                  1234 stars  TypeScript                      |
|   octocat/api                      210 stars  Go                              |
|   octocat/notes                     18 stars  Python                          |
|                                                                              |
| 42 repositories | Esc leaves search                                          |
+------------------------------------------------------------------------------+
```

### Dashboard

```text
+------------------------------------------------------------------------------+
| Repositron | octocat/widget | 1234 stars | js, python                         |
+------------------------------------------------------------------------------+
| [1] Overview  [2] Tools  [3] Activity  [4] Dependencies  [5] CI              |
|                                                                              |
| +-- Adoption score ----------------+  +-- Repository health ---------------+ |
| | 72.50 / 100                      |  | 81.20 / 100                       | |
| | [###############-------] 73%     |  | [###################---] 81%      | |
| +----------------------------------+  +-----------------------------------+ |
|                                                                              |
| Bus factor: YELLOW | Tools: 8/13 detected | Commits/30d: 24                 |
| Dependencies: 46 parsed | CI: 92.00% success across 38 runs                |
|                                                                              |
| Press 1-5 to switch tabs. q or Esc returns to the repository picker.         |
+------------------------------------------------------------------------------+
```

## Controls

| Context | Key | Action |
| --- | --- | --- |
| Repository picker | Type or `/` | Filter repositories |
| Repository picker | Up / Down | Move selection |
| Repository picker | Enter | Scan selected repository |
| Repository picker | Esc | Leave the search field |
| Dashboard | `1`-`5` | Switch tabs |
| Dashboard | `q` / Esc | Return to the repository picker |
| Any screen | Ctrl+C | Exit |

## What gets scanned

- Tool adoption across 13 detectors: Jest, ESLint, Prettier, pytest, Black,
  Ruff, pre-commit, GitHub Actions, Dependabot, Renovate, `go test`,
  golangci-lint, and PHPUnit.
- Bus factor and contributor concentration using the Gini coefficient and
  top 1/3/10 shares.
- Commit activity by day, week, and contributor over 30, 90, 180, and 365 day
  windows.
- GitHub Actions success rates, average durations, and recent failures.
- Dependency counts parsed from local manifests such as `package.json`,
  `requirements.txt`, `pyproject.toml`, `go.mod`, `Gemfile`, and
  `composer.json`.

Scans are intentionally bounded to keep the CLI responsive: the 30 most recent
commit diffs, up to 500 commits, up to 200 contributors, and up to 300 workflow
runs. See [docs/insights.md](docs/insights.md) for the metric definitions and
their limitations.

## Install from source

```sh
git clone https://github.com/zelvarys/repositron.git
cd repositron
npm install
npm run build
node dist/cli.js
```

During development:

```sh
npm run dev
npm test
npm run typecheck
```

See [docs/development.md](docs/development.md) for testing with a personal
access token and [docs/architecture.md](docs/architecture.md) for the code
layout.

## License

MIT
