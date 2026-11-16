<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="Repositron terminal prompt mark">
</p>

<h1 align="center">Repositron</h1>

<p align="center">An interactive terminal dashboard for GitHub repository health.</p>

Repositron is a local-first CLI. It logs in to GitHub once, lets you pick a
repository you own or have contributed to, scans it on demand, and presents
adoption, activity, bus factor, dependency, and CI insights in a
keyboard-driven terminal UI. There is no database, hosted backend, or worker to
run.

## Quick start

Requires Node.js 22 or newer.

```sh
npx repositron
```

On first run Repositron starts GitHub's OAuth Device Flow:

1. It opens GitHub in your browser.
2. Enter the short code shown in the terminal.
3. Authorize the request. The token is stored locally for next time.

The picker lists repositories you own plus repositories you contributed to in
the last 12 months. Organization membership alone does not add a repository to
the list.

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
| [>_] REPOSITRON  repository intelligence                          @octocat   |
+------------------------------------------------------------------------------+
| FIND A REPOSITORY                                42 owned or contributed    |
| +--------------------------------------------------------------------------+ |
| | > Search repositories                                                    | |
| +--------------------------------------------------------------------------+ |
| +--------------------------------------------------------------------------+ |
| | Repositories                                      arrow keys to move     | |
| | ▸ octocat/widget                     1234 stars  TypeScript              | |
| |   octocat/api                         210 stars  Go                      | |
| |   octocat/notes                        18 stars  Python                  | |
| +--------------------------------------------------------------------------+ |
| +--------------------------------------------------------------------------+ |
| | octocat/widget                                             ● public      | |
| | An interactive terminal dashboard for repository health.                 | |
| | branch main  ★ 1.2k  forks 84                         updated 2d ago      | |
| +--------------------------------------------------------------------------+ |
+------------------------------------------------------------------------------+
| 42 matches  |  Esc leaves search                     Enter scans  | Ctrl+C exits |
+------------------------------------------------------------------------------+
```

### Dashboard

```text
+------------------------------------------------------------------------------+
| [>_] REPOSITRON  repository intelligence                   OVERVIEW @octocat |
| octocat/widget                                                     ★ 1234    |
+------------------------------------------------------------------------------+
| [ 1 Overview ]  2 Tools   3 Activity   4 Dependencies   5 CI                 |
| +--------------------------------------------------------------------------+ |
| | REPOSITORY HEALTH              Activity ━━━━━━━━━━━━━━━─── 82            | |
| | 84.2 / 100                     Workflow ━━━━━━━━━━━━━━──── 78            | |
| | healthy                        Spread   ━━━━━━━━━━━━━───── 71            | |
| |                               Quality  ━━━━━━━━━━━━━───── 74            | |
| +--------------------------------------------------------------------------+ |
| +---------------------------------+  +-------------------------------------+ |
| | COMMIT ACTIVITY                 |  | TOOL ADOPTION                       | |
| | 24 commits / 30d                |  | 8/13 detected                       | |
| | 7 contributors  |  38.2% top 1  |  | 11 relevant to this stack           | |
| +---------------------------------+  +-------------------------------------+ |
| +---------------------------------+  +-------------------------------------+ |
| | DEPENDENCIES                    |  | CONTRIBUTOR CONCENTRATION           | |
| | 46 direct                       |  | 38.2% top 1                         | |
| | 7 outdated  |  46 checked       |  | Gini 0.41  |  top 3 71%             | |
| +---------------------------------+  +-------------------------------------+ |
+------------------------------------------------------------------------------+
| 1-5 switch view  |  q/Esc repos  |  Ctrl+C exit          2026-11-16 01:42:11 |
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
| Dependencies tab | `f` | Cycle all / outdated |
| Dependencies tab | Left / Right | Page through rows |
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
- Direct dependencies parsed from local manifests such as `package.json`,
  `requirements.txt`, `pyproject.toml`, `go.mod`, `Gemfile`, and
  `composer.json`.
- Latest versions from npm, PyPI, the Go module proxy, RubyGems, and Packagist.

Scans are intentionally bounded to keep the CLI responsive: the 30 most recent
commit diffs, up to 500 commits, up to 200 contributors, up to 300 workflow
runs, and up to 300 parsed dependencies. Registry lookups run eight at a time
with a 10 second timeout per request. See
[docs/insights.md](docs/insights.md) for the metric definitions and their
limitations.

## Terminal rendering

The UI uses ANSI colors, rounded borders, thin meters, and Unicode glyphs. It
does not print emojis. Secondary text is rendered in white rather than dark
grey so it stays readable on dark terminals. Set `REPOSITRON_ASCII=1` to swap
meters and marker glyphs for ASCII equivalents on limited terminals.

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
