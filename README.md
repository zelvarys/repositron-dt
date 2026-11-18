<p align="center">
  <img src="assets/readme/terminal.svg" alt="Repositron terminal dashboard showing repository health, activity, dependencies, contributor concentration, tool adoption, and CI health" width="100%">
</p>

<p align="center">
  <b>An interactive terminal dashboard for GitHub repository health.</b><br>
  Activity · tool adoption · dependencies · CI · bus factor
</p>

<p align="center">
  <a href="https://github.com/zelvarys/repositron-dt/tree/cli"><img src="https://img.shields.io/badge/source-cli_branch-60a5fa?style=for-the-badge&labelColor=09090b" alt="CLI source"></a>
  <a href="https://www.npmjs.com/package/repositron"><img src="https://img.shields.io/npm/v/repositron?style=for-the-badge&color=60a5fa&labelColor=09090b" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/repositron"><img src="https://img.shields.io/npm/dt/repositron?style=for-the-badge&color=60a5fa&labelColor=09090b" alt="npm total downloads"></a>
  <a href="https://github.com/zelvarys/repositron-dt/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-4ade80?style=for-the-badge&labelColor=09090b" alt="MIT license"></a>
</p>

## Overview

Repositron is a local-first CLI for understanding the health of a GitHub
repository. It gives you one keyboard-driven view of recent activity, contributor
risk, tool adoption, dependency drift, and CI stability without uploading your
code or maintaining a hosted service.

Point it at a repository you own or have contributed to, scan it on demand, and
move between focused views in the terminal. There is no database, backend, or
worker to run.

## Quick start

Requires Node.js 20 or newer. Node.js 22 is recommended.

```sh
npx repositron
```

On first run, Repositron starts GitHub's OAuth Device Flow:

1. It opens GitHub in your browser.
2. Enter the short code shown in the terminal.
3. Authorize the request. The token is saved locally for next time.

The picker lists repositories you own plus repositories you contributed to in
the last 12 months. Organization membership alone does not add a repository to
the list.

## What you get

| View | What it shows |
| --- | --- |
| Overview | A weighted health score, commit activity, tool adoption, dependency drift, and contributor concentration |
| Tools | Adoption across 13 detectors for test runners, linters, CI, and dependency automation |
| Activity | Commit ranges over 30, 90, 180, and 365 days, weekly rhythm, weekday pulse, contributors, and commit quality |
| Dependencies | Direct manifests, latest registry versions, and major-version drift across npm, PyPI, Go, RubyGems, and Packagist |
| CI | Workflow success rates, run counts, average duration, and recent failures, with Dependabot runs filtered out |

Tool detection covers Jest, ESLint, Prettier, pytest, Black, Ruff, pre-commit,
GitHub Actions, Dependabot, Renovate, `go test`, golangci-lint, and PHPUnit.
Contributor risk uses the Gini coefficient plus top 1, 3, and 10 shares.

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

## Local-first by design

- No token is sent anywhere except the GitHub API.
- The saved token lives in your user config directory and is protected by your
  operating system account permissions.
- Scans run from your machine and are intentionally bounded: the 30 most recent
  commit diffs, up to 500 commits, 200 contributors, 300 workflow runs, and 300
  dependencies.
- Registry lookups run eight at a time with a 10 second timeout per request.

See the [insight definitions](https://github.com/zelvarys/repositron-dt/blob/cli/docs/insights.md)
for metric details and limitations.

## Terminal support

The UI uses ANSI colors, rounded borders, thin meters, and Unicode glyphs. Set
`REPOSITRON_ASCII=1` to use ASCII markers on terminals with limited Unicode
support.

## Development

The CLI source, tests, and detailed docs live on the
[`cli` branch](https://github.com/zelvarys/repositron-dt/tree/cli).

- [Architecture](https://github.com/zelvarys/repositron-dt/blob/cli/docs/architecture.md)
- [Metric definitions](https://github.com/zelvarys/repositron-dt/blob/cli/docs/insights.md)
- [Development guide](https://github.com/zelvarys/repositron-dt/blob/cli/docs/development.md)

## License

MIT
