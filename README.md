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
  <a href="https://github.com/zelvarys/repositron-dt/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-4ade80?style=for-the-badge&labelColor=09090b" alt="MIT license"></a>
</p>

## Run it

Requires Node.js 22 or newer.

```sh
npx repositron
```

Repositron signs in with GitHub, lists repositories you own or have contributed
to in the last 12 months, scans one on demand, and opens a keyboard-driven
dashboard. There is no database, hosted backend, or worker to run.

## What it checks

| Area | What you get |
| --- | --- |
| Repository health | One weighted score across activity, CI stability, contributor spread, and commit quality |
| Activity | Commit ranges, weekly rhythm, weekday pulse, contributors, and commit quality |
| Tool adoption | Up to 13 detectors, including test runners, linters, CI, and dependency automation |
| Bus factor | Gini coefficient plus top 1, 3, and 10 contributor shares |
| Dependencies | Direct manifests, latest registry versions, and major-version drift |
| CI | Workflow success rates, run counts, average duration, and recent failures |

Scans are local-first and intentionally bounded. The CLI README documents the
metric definitions, limits, and development workflow.

## License

MIT
