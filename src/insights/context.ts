import type { CiRun } from './types.js'

export type CommitFile = {
  filename: string
  status: string
  additions: number
  deletions: number
}

export type CommitInfo = {
  sha: string
  authorLogin: string | null
  authorName?: string | null
  message: string
  date: string
  files: CommitFile[]
}

export type ContributorInfo = {
  login: string
  contributions: number
}

export type ScanContext = {
  owner: string
  name: string
  defaultBranch: string
  fetchedAt: string
  commits: CommitInfo[]
  commitHistory: CommitInfo[]
  contributors: ContributorInfo[]
  rootFiles: string[]
  configFiles: Record<string, string>
  workflowFiles: string[]
  ciRuns: CiRun[]
  ciPartial: boolean
  ciError: string | null
}
