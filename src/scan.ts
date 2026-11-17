import type { GitHubClient } from './github/client.js'
import type { GitHubRepo } from './github/repos.js'
import {
  fetchCommitDetail,
  fetchCommits,
  fetchContents,
  fetchContributors,
  fetchWorkflowRuns,
  readFileText,
} from './github/fetch.js'
import type {
  CommitFile,
  CommitInfo,
  ContributorInfo,
  ScanContext,
} from './insights/context.js'
import type { CiRun, RepositoryReport } from './insights/types.js'
import {
  buildCommitActivity,
  isMergeCommit,
} from './insights/activity.js'
import { computeBusFactor } from './insights/bus-factor.js'
import { aggregateCiHealth, isDependabotRun } from './insights/ci.js'
import { collectDependencyHealth } from './insights/dependency-check.js'
import { computeRepoHealth } from './insights/health.js'
import {
  buildToolMetrics,
  detectLanguages,
  runDetectors,
} from './insights/tools.js'

const MAX_COMMIT_DETAIL_LOOKUPS = 30
const MAX_CONTRIBUTORS_PAGES = 2
const MAX_COMMITS_PAGES = 5
const DETAIL_CONCURRENCY = 5
const ACTIVITY_WINDOW_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

const CONFIG_FILE_CANDIDATES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  'prettier.config.js',
  'prettier.config.cjs',
  'jest.config.js',
  'jest.config.ts',
  'jest.config.mjs',
  'jest.config.cjs',
  'jest.config.json',
  'pyproject.toml',
  'setup.cfg',
  'setup.py',
  'requirements.txt',
  'requirements-dev.txt',
  'dev-requirements.txt',
  'Pipfile',
  'pytest.ini',
  'tox.ini',
  'ruff.toml',
  '.ruff.toml',
  'go.mod',
  'go.sum',
  '.golangci.yml',
  '.golangci.yaml',
  '.golangci.toml',
  '.golangci.json',
  'composer.json',
  'composer.lock',
  'phpunit.xml',
  'phpunit.xml.dist',
  'Gemfile',
  'Gemfile.lock',
  '.rubocop.yml',
]

const CONFIG_SUBDIR_CANDIDATES = [
  '.github/dependabot.yml',
  '.github/dependabot.yaml',
  '.github/renovate.json',
  '.github/renovate.json5',
  'renovate.json',
  'renovate.json5',
  '.renovaterc',
  '.renovaterc.json',
  '.pre-commit-config.yaml',
  '.coveralls.yml',
  'codecov.yml',
  '.codecov.yml',
]

export type ScanProgress = (message: string) => void

export type ScanResult = {
  repo: GitHubRepo
  context: ScanContext
  report: RepositoryReport
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index]!, index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  )
  return results
}

async function fetchCommitDetails(
  client: GitHubClient,
  owner: string,
  repo: string,
  commits: CommitInfo[],
  onProgress: ScanProgress,
): Promise<void> {
  const targets = commits.slice(0, MAX_COMMIT_DETAIL_LOOKUPS)
  if (targets.length === 0) return

  onProgress(`Reading ${targets.length} commit diffs...`)
  await mapWithConcurrency(targets, DETAIL_CONCURRENCY, async (commit) => {
    const detail = await fetchCommitDetail(client, owner, repo, commit.sha)
    const files: CommitFile[] = (detail.files ?? []).map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
    }))
    commit.files = files
  })
}

async function fetchConfigFiles(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
  rootFiles: string[],
  onProgress: ScanProgress,
): Promise<Record<string, string>> {
  const configFiles: Record<string, string> = {}
  const rootSet = new Set(rootFiles)
  onProgress('Reading configuration files...')

  for (const path of CONFIG_FILE_CANDIDATES) {
    if (!rootSet.has(path)) continue
    const content = await readFileText(client, owner, repo, path, branch)
    if (content !== null) configFiles[path] = content
  }

  for (const path of CONFIG_SUBDIR_CANDIDATES) {
    const content = await readFileText(client, owner, repo, path, branch)
    if (content !== null) configFiles[path] = content
  }

  return configFiles
}

async function fetchWorkflows(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
  onProgress: ScanProgress,
): Promise<{ workflowFiles: string[]; configFiles: Record<string, string> }> {
  onProgress('Reading workflow definitions...')
  const entries = await fetchContents(
    client,
    owner,
    repo,
    '.github/workflows',
    branch,
  )
  const workflowFiles = entries
    .filter((entry) => entry.type === 'file')
    .map((entry) => `.github/workflows/${entry.name}`)

  const configFiles: Record<string, string> = {}
  for (const path of workflowFiles) {
    const content = await readFileText(client, owner, repo, path, branch)
    if (content !== null) configFiles[path] = content
  }

  return { workflowFiles, configFiles }
}

async function fetchCiRuns(
  client: GitHubClient,
  owner: string,
  repo: string,
  workflowFiles: string[],
): Promise<{
  ciRuns: CiRun[]
  ciPartial: boolean
  ciError: string | null
}> {
  if (workflowFiles.length === 0) {
    return { ciRuns: [], ciPartial: false, ciError: null }
  }

  try {
    const runs = await fetchWorkflowRuns(client, owner, repo, 3)
    const ciRuns = runs.map<CiRun>((run) => {
      const startedAt = run.run_started_at ?? run.created_at
      const completedAt = run.status === 'completed' ? run.updated_at : null
      const startMs = Date.parse(startedAt)
      const endMs = completedAt ? Date.parse(completedAt) : Number.NaN
      return {
        runId: run.id,
        workflowName: run.name ?? run.display_title ?? 'Workflow',
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        actor: run.actor?.login ?? null,
        startedAt,
        completedAt,
        durationSeconds:
          Number.isFinite(startMs) && Number.isFinite(endMs)
            ? Math.max(0, Math.round((endMs - startMs) / 1000))
            : null,
        url: run.html_url,
      }
    }).filter((run) => !isDependabotRun(run))
    return {
      ciRuns,
      ciPartial: runs.length >= 300,
      ciError: null,
    }
  } catch (error) {
    return {
      ciRuns: [],
      ciPartial: true,
      ciError: error instanceof Error ? error.message : String(error),
    }
  }
}

async function buildReport(
  repo: GitHubRepo,
  context: ScanContext,
  now: Date,
  onProgress: ScanProgress,
): Promise<RepositoryReport> {
  const languages = detectLanguages({
    rootFiles: context.rootFiles,
    commitFilenames: context.commits.flatMap((commit) =>
      commit.files.map((file) => file.filename),
    ),
    configFileKeys: Object.keys(context.configFiles),
  })
  const metrics = buildToolMetrics(
    runDetectors(context),
    languages,
    repo.full_name,
  )
  const activity = buildCommitActivity(context.commitHistory, now)
  const cutoff = now.getTime() - ACTIVITY_WINDOW_DAYS * DAY_MS
  const busFactor = computeBusFactor(
    context.commitHistory
      .filter((commit) => Date.parse(commit.date) >= cutoff)
      .filter((commit) => !isMergeCommit(commit.message))
      .flatMap((commit) => {
        const author = (commit.authorLogin ?? commit.authorName ?? '').trim()
        if (!author || /\[bot\]$/i.test(author)) return []
        return [{ authorLogin: author }]
      }),
  )
  const ci =
    context.workflowFiles.length > 0
      ? aggregateCiHealth(
          context.ciRuns,
          context.ciPartial,
          now.toISOString(),
        )
      : null
  const dependencies = await collectDependencyHealth(
    context.configFiles,
    onProgress,
  )
  onProgress('Calculating insights...')
  const commitsLast90 = Object.values(activity.ranges[90].daily).reduce(
    (sum, count) => sum + count,
    0,
  )
  const health = computeRepoHealth({
    commitsLast90,
    ciSuccessRate: ci?.successRate ?? null,
    ciTotalRuns: ci?.totalRuns ?? null,
    busFactor,
    quality: activity.quality,
  })

  return {
    repoFullName: repo.full_name,
    defaultBranch: repo.default_branch,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    description: repo.description,
    contributorCount: context.contributors.length,
    metrics,
    health,
    busFactor,
    activity,
    ci,
    dependencies,
    scannedAt: now.toISOString(),
  }
}

export async function scanRepository(
  client: GitHubClient,
  repo: GitHubRepo,
  onProgress: ScanProgress = () => undefined,
): Promise<ScanResult> {
  const owner = repo.owner.login
  const name = repo.name
  const branch = repo.default_branch

  onProgress('Loading contributors and commit history...')
  const [contributorsRaw, commitsRaw, rootEntries] = await Promise.all([
    fetchContributors(client, owner, name, MAX_CONTRIBUTORS_PAGES),
    fetchCommits(client, owner, name, branch, MAX_COMMITS_PAGES),
    fetchContents(client, owner, name, '', branch),
  ])

  const contributors: ContributorInfo[] = contributorsRaw.map((entry) => ({
    login: entry.login,
    contributions: entry.contributions,
  }))
  const fetchedAt = new Date().toISOString()
  const commitHistory: CommitInfo[] = commitsRaw.map((commit) => ({
    sha: commit.sha,
    authorLogin: commit.author?.login ?? null,
    authorName: commit.commit.author?.name ?? null,
    message: commit.commit.message,
    date: commit.commit.author?.date ?? fetchedAt,
    files: [],
  }))
  const commits: CommitInfo[] = commitHistory
    .slice(0, MAX_COMMIT_DETAIL_LOOKUPS)
    .map((commit) => ({ ...commit, files: [] }))

  await fetchCommitDetails(client, owner, name, commits, onProgress)

  const rootFiles = rootEntries
    .filter((entry) => entry.type === 'file')
    .map((entry) => entry.name)
  const configFiles = await fetchConfigFiles(
    client,
    owner,
    name,
    branch,
    rootFiles,
    onProgress,
  )
  const workflows = await fetchWorkflows(
    client,
    owner,
    name,
    branch,
    onProgress,
  )
  Object.assign(configFiles, workflows.configFiles)

  onProgress('Reading workflow runs...')
  const ci = await fetchCiRuns(client, owner, name, workflows.workflowFiles)

  const context: ScanContext = {
    owner,
    name,
    defaultBranch: branch,
    fetchedAt,
    commits,
    commitHistory,
    contributors,
    rootFiles,
    configFiles,
    workflowFiles: workflows.workflowFiles,
    ciRuns: ci.ciRuns,
    ciPartial: ci.ciPartial,
    ciError: ci.ciError,
  }

  const report = await buildReport(repo, context, new Date(), onProgress)
  return { repo, context, report }
}
