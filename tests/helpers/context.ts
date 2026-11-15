import type {
  CommitFile,
  CommitInfo,
  ContributorInfo,
  ScanContext,
} from '../../src/insights/context.js'
import type { CiRun } from '../../src/insights/types.js'

type ContextOptions = {
  owner?: string
  name?: string
  defaultBranch?: string
  rootFiles?: string[]
  configFiles?: Record<string, string>
  workflowFiles?: string[]
  commits?: CommitInfo[]
  commitHistory?: CommitInfo[]
  contributors?: ContributorInfo[]
  ciRuns?: CiRun[]
}

export function buildContext(options: ContextOptions = {}): ScanContext {
  return {
    owner: options.owner ?? 'acme',
    name: options.name ?? 'widget',
    defaultBranch: options.defaultBranch ?? 'main',
    fetchedAt: new Date('2026-10-29T12:00:00.000Z').toISOString(),
    commits: options.commits ?? [],
    commitHistory: options.commitHistory ?? options.commits ?? [],
    contributors: options.contributors ?? [],
    rootFiles: options.rootFiles ?? [],
    configFiles: options.configFiles ?? {},
    workflowFiles: options.workflowFiles ?? [],
    ciRuns: options.ciRuns ?? [],
    ciPartial: false,
    ciError: null,
  }
}

export function buildCommit(options: {
  sha?: string
  authorLogin?: string | null
  authorName?: string | null
  message?: string
  date?: string
  filenames?: string[]
}): CommitInfo {
  const files: CommitFile[] = (options.filenames ?? []).map((filename) => ({
    filename,
    status: 'modified',
    additions: 1,
    deletions: 0,
  }))

  return {
    sha: options.sha ?? 'abc123',
    authorLogin: options.authorLogin ?? null,
    authorName: options.authorName ?? null,
    message: options.message ?? 'chore: update',
    date: options.date ?? new Date('2026-10-29T00:00:00.000Z').toISOString(),
    files,
  }
}
