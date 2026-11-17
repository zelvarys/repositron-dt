# Insights

Most insight code is synchronous and in-memory: it receives a `ScanContext`
built by `src/scan.ts`, then runs detectors and aggregates. Dependency checks are
the exception; they query package registries after the manifests are parsed.
This document describes the detectors, aggregates, formulas, and the places
where the numbers are approximations.

## Tool adoption

Repositron runs 13 detectors from `src/insights/detectors/`. A detector can use
four kinds of evidence:

1. A known configuration file, with content checks where needed.
2. A dependency or script declared in a manifest.
3. A workflow file that invokes the tool.
4. A commit in the fetched window that touched a relevant file.

| Tool | Category | Detection evidence | Adoption signal |
| --- | --- | --- | --- |
| `jest` | testing | Jest config, `package.json` dependency/script, workflow invocation | Touched a test file |
| `eslint` | linting | ESLint config, `package.json` dependency/script, workflow | Touched a lintable JS/TS/Vue/Svelte file |
| `prettier` | linting | Prettier config, `package.json` dependency/script, workflow | Touched a formattable file |
| `pytest` | testing | pytest config/`pyproject`, requirements/setup files, workflow | Touched a Python test file |
| `black` | linting | `pyproject.toml`, `setup.cfg`, requirements/setup/tox, workflow | Touched Python source |
| `ruff` | linting | `ruff.toml`, `.ruff.toml`, `pyproject.toml`, requirements, workflow | Touched Python source |
| `pre-commit` | linting | `.pre-commit-config.yaml`, workflow | Touched a source or config file |
| `github-actions` | CI/CD | Any workflow file exists | Any commit in the window |
| `dependabot` | dependencies | Dependabot config | Touched a dependency manifest or lockfile |
| `renovate` | dependencies | Renovate config or `package.json` dependency | Touched a dependency manifest or lockfile |
| `go-test` | testing | `_test.go` change, workflow `go test` | Touched a `_test.go` file |
| `golangci-lint` | linting | golangci config, workflow | Touched a Go source file |
| `phpunit` | testing | PHPUnit config, `composer.json`, workflow | Touched a `Test.php` file |

Detection and adoption are separate. A tool is `detected` if it is configured
anywhere in the scanned files or workflows. Its adoption rate is:

```text
adoption = contributors with a per-contributor signal / contributors fetched
```

Rates are rounded to two decimals and are `0` when the tool is not detected or
the repository has no contributors. The denominator is the contributor list from
GitHub, while the signal comes from the 30 commits with fetched diffs. This is a
file-touch proxy: it does not prove that a contributor ran the tool locally, only
that they changed files the tool typically covers.

Each detector is marked relevant or not relevant based on detected languages.
For example, Python tools are not relevant to a JavaScript-only repository. The
aggregate adoption score is the mean adoption rate of detected, relevant tools.
Commit-presence tools (`github-actions`, `dependabot`, and `renovate`) are
excluded from that average because their adoption would only mirror the whole
contributor list. If no scored tools are detected, the score is `0`.

## Bus factor

`computeBusFactor()` uses non-merge commits from the last 365 days. Authors are
resolved from the GitHub login, then the commit author name. Bot accounts ending
in `[bot]` are excluded.

It reports:

- Total commits and contributor count.
- Top 1, top 3, and top 10 share of commits, as percentages.
- The Gini coefficient of commit counts.
- Top contributor rows with commit counts and shares.

The Gini coefficient is computed on positive commit counts sorted ascending:

```text
G = (2 * sum((i + 1) * sortedCount[i]) / (n * total)) - (n + 1) / n
```

where `i` is the zero-based index. It is rounded to two decimals. A value of `0`
means equal commit counts; `1` means a single contributor.

Risk uses the top-1 share:

| Top-1 share | Risk |
| --- | --- |
| Less than 50% | `green` |
| 50% through 75% | `yellow` |
| Greater than 75% | `red` |

Commits without a login are grouped under `unknown` rather than dropped. Merges
are excluded because they duplicate the work already represented by their
parent commits.

## Commit activity and quality

`buildCommitActivity()` builds 30, 90, 180, and 365 day windows. For each window
it stores:

- Daily commit counts keyed by UTC date.
- Weekly counts keyed by the Monday of the ISO-style week.
- Weekday and hour-of-day histograms in UTC.
- The top 20 contributors by commit count.
- `commitsLast30` used by the dashboard.

The range check includes the boundary day: a 30-day window with a reference time
of `2026-10-29T12:00Z` starts at `2026-09-30T12:00Z`.

Commit quality is calculated from commits in the last 365 days, excluding merge
commits and empty messages:

- Conventional Commit percentage, matching `feat`, `fix`, `docs`, `chore`,
  `refactor`, `test`, `style`, or `perf` with an optional scope and `!`.
- Percentage of commits with a non-empty body.
- Average first-line and body length.
- The most common conventional type.
- Up to three sanitized malformed examples. Email addresses become `[email]`
  and `@mentions` become `@user`.
- First-line length buckets: 0-20, 21-40, 41-60, 61-80, and 81+ characters.

The Activity tab summarizes the last 12 weeks and weekday distribution as
compact text statistics, then lists the top contributors with commit shares.
`REPOSITRON_ASCII=1` switches meter glyphs to an ASCII fallback.

## CI health

`aggregateCiHealth()` considers only completed workflow runs. In-progress and
queued runs are ignored, and Dependabot workflows are excluded.

- Overall success rate: successful completed runs divided by all completed runs.
- Per-workflow statistics use the 30 most recent completed runs for that
  workflow.
- Average duration uses completed runs with a non-negative duration.
- Recent failures include `failure` and `timed_out` conclusions, newest first.
- `partial` is set when the workflow run history was truncated or could not be
  fetched. The dashboard surfaces this rather than silently presenting partial
  data as complete.

`filterCiRuns()` supports workflow, branch, and 30/90/365 day filters for
in-memory analysis. `worstWorkflow()` reports the lowest-success workflow only
when at least two workflows each have more than ten runs.

## Dependency parsing

`parseDependencies()` reads local manifest content from the scan context. It
supports:

- npm: `package.json`
- Python: `requirements.txt`, `requirements-dev.txt`,
  `dev-requirements.txt`, `pyproject.toml`, `setup.cfg`, `setup.py`, `Pipfile`
- Go: `go.mod`
- Ruby: `Gemfile`
- PHP: `composer.json`

Dependencies are deduplicated by ecosystem and name. If the first version is
`*` and a later manifest supplies a concrete version, the concrete version wins.
Workspace, file, link, git, URL, and floating versions are handled according to
the manifest parser. A malformed manifest sets `partial` to `true`; it does not
abort the scan.

After parsing, `collectDependencyHealth()` enriches up to 300 dependencies:

- Latest versions come from the public npm, PyPI, Go proxy, RubyGems, and
  Packagist registries.
- A dependency is outdated only when the latest stable version is at least one
  major version ahead of the declared version.
- Lookups run with a concurrency of 8, a 10 second timeout per request, and an
  in-process cache keyed by package and version.

Floating versions such as `*` are counted but not sent to a registry. A failed
registry lookup, truncated manifest list, or malformed manifest sets `partial`
to `true`. The Dependencies tab separates all and outdated rows, shows current
and latest versions, and pages through the result set.

## Repository health

`computeRepoHealth()` combines four components:

| Component | Score | Weight |
| --- | --- | --- |
| Activity | `commitsLast90 / 50 * 100`, clamped | 0.30 |
| Workflow stability | CI success rate | 0.25 |
| Contributor spread | `(1 - Gini) * 100` | 0.25 |
| Commit quality | Mean of conventional and body percentages | 0.20 |

Unavailable components are excluded and the remaining weights are renormalized.
If no component is available the score is `null`. The dashboard renders a missing
score as `n/a` rather than zero.

## Limitations

- Adoption is a file-touch proxy based on up to 30 fetched commit diffs.
- Only the default branch is scanned.
- Only the known root config files and workflows are fetched.
- Workflow history is capped at 300 runs; older runs are not requested.
- Contributor history is capped at 200 contributors.
- Activity and bus factor use up to 500 commits from the GitHub commits API.
- Timestamps are handled in UTC, so local-time weekday and hour charts may differ
  from a contributor's wall clock.
- Pull requests, issues, releases, and security advisories are not scanned.
- Private repositories depend on the token scopes and GitHub API rate limits.
- No repository data is persisted. Every scan uses fresh GitHub requests; dependency registry lookups use an in-process cache for the lifetime of the CLI.
