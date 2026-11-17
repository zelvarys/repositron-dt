import { GitHubApiError, type GitHubClient } from './client.js'
import {
  parseDependencies,
  type ParseResult,
} from '../insights/dependencies.js'

export type GitHubCommitListItem = {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    } | null
  }
  author: { login: string } | null
}

export type GitHubCommitDetail = {
  sha: string
  files?: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
  }>
}

export type GitHubContributor = {
  login: string
  id: number
  contributions: number
  avatar_url: string
}

export type GitHubContentEntry = {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  name: string
  path: string
  sha: string
  size?: number
}

export type GitHubTreeEntry = {
  path: string
  mode: string
  type: 'blob' | 'tree' | 'commit'
  sha: string
  size?: number
  url: string
}

export type GitHubTreeResponse = {
  sha: string
  url: string
  truncated: boolean
  tree: GitHubTreeEntry[]
}

export type GitHubWorkflowRun = {
  id: number
  name: string | null
  display_title?: string
  path?: string
  status: string
  conclusion: string | null
  head_branch: string | null
  actor: { login: string } | null
  run_started_at: string | null
  created_at: string
  updated_at: string
  html_url: string
}

function encodePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export async function fetchCommits(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
  maxPages = 5,
): Promise<GitHubCommitListItem[]> {
  const all: GitHubCommitListItem[] = []
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await client.get<GitHubCommitListItem[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(
        branch,
      )}&per_page=100&page=${page}`,
    )
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

export async function fetchCommitDetail(
  client: GitHubClient,
  owner: string,
  repo: string,
  sha: string,
): Promise<GitHubCommitDetail> {
  return client.get<GitHubCommitDetail>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(
      sha,
    )}`,
  )
}

export async function fetchContributors(
  client: GitHubClient,
  owner: string,
  repo: string,
  maxPages = 2,
): Promise<GitHubContributor[]> {
  const all: GitHubContributor[] = []
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await client.get<GitHubContributor[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=100&page=${page}&anon=false`,
    )
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

export async function fetchContents(
  client: GitHubClient,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<GitHubContentEntry[]> {
  const encoded = encodePath(path)
  try {
    const data = await client.get<GitHubContentEntry[] | GitHubContentEntry>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encoded}?ref=${encodeURIComponent(
        ref,
      )}`,
    )
    return Array.isArray(data) ? data : [data]
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) return []
    throw error
  }
}

export async function readFileText(
  client: GitHubClient,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string | null> {
  const encoded = encodePath(path)
  try {
    const data = await client.get<
      | { type: 'file'; content: string; encoding: string }
      | GitHubContentEntry[]
    >(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encoded}?ref=${encodeURIComponent(
        ref,
      )}`,
    )
    if (Array.isArray(data)) return null
    if (data.type !== 'file' || data.encoding !== 'base64') return null
    return Buffer.from(data.content, 'base64').toString('utf8')
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) return null
    throw error
  }
}

export async function fetchReadme(
  client: GitHubClient,
  owner: string,
  repo: string,
  ref?: string,
): Promise<string | null> {
  const suffix = ref ? `?ref=${encodeURIComponent(ref)}` : ''
  const data = await client.get<{
    content?: string
    encoding?: string
  }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme${suffix}`,
  )
  if (!data.content || data.encoding !== 'base64') return null
  return Buffer.from(data.content, 'base64').toString('utf8')
}

export async function fetchRepoTree(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubTreeResponse> {
  const data = await client.get<GitHubTreeResponse>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(
      branch,
    )}?recursive=1`,
  )
  return {
    ...data,
    tree: Array.isArray(data.tree) ? data.tree : [],
  }
}

export function isDependabotWorkflowRun(run: GitHubWorkflowRun): boolean {
  return [run.name, run.display_title, run.actor?.login, run.path].some(
    (value) => value !== null && value !== undefined && /dependabot/i.test(value),
  )
}

export async function fetchWorkflowRuns(
  client: GitHubClient,
  owner: string,
  repo: string,
  maxPages = 3,
): Promise<GitHubWorkflowRun[]> {
  const all: GitHubWorkflowRun[] = []
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await client.get<{ workflow_runs?: GitHubWorkflowRun[] }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs?per_page=100&page=${page}`,
    )
    const runs = batch.workflow_runs ?? []
    all.push(...runs.filter((run) => !isDependabotWorkflowRun(run)))
    if (runs.length < 100) break
  }
  return all
}

const DEFAULT_DEPENDENCY_MANIFESTS = [
  'package.json',
  'requirements.txt',
  'requirements-dev.txt',
  'dev-requirements.txt',
  'pyproject.toml',
  'setup.cfg',
  'setup.py',
  'Pipfile',
  'go.mod',
  'Gemfile',
  'composer.json',
]

export async function fetchDependencies(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
  paths: string[] = DEFAULT_DEPENDENCY_MANIFESTS,
): Promise<ParseResult> {
  const configFiles: Record<string, string> = {}
  for (const path of paths) {
    const content = await readFileText(client, owner, repo, path, branch)
    if (content !== null) configFiles[path] = content
  }
  return parseDependencies(configFiles)
}
