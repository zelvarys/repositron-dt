import type { ScanContext } from './context.js'

export type ToolCategory =
  | 'testing'
  | 'linting'
  | 'ci_cd'
  | 'coverage'
  | 'docs'
  | 'dependencies'

export type DetectionEvidence = {
  configFiles?: string[]
  dependencyFiles?: string[]
  ciWorkflows?: string[]
  commits?: string[]
}

export type DetectionResult = {
  tool: string
  category: ToolCategory
  detected: boolean
  adoptionRate: number
  evidence: DetectionEvidence
  perContributor?: Record<string, boolean>
}

export interface ToolDetector {
  name: string
  category: ToolCategory
  detect(ctx: ScanContext): DetectionResult
}

export type ToolMetric = {
  name: string
  category: ToolCategory
  detected: boolean
  relevant: boolean
  adoptionRate: number
  contributorCount: number
  contributorsUsing: number
  evidence: Record<string, unknown> | null
}

export type RepoMetrics = {
  repoFullName: string
  adoptionScore: number
  adoption: number
  languages: string[]
  toolsChecked: number
  toolsRelevant: number
  toolsDetected: number
  tools: ToolMetric[]
}

export type ContributorActivity = {
  login: string
  commits: number
}

export type CommitQuality = {
  totalCommits: number
  conventionalPercent: number
  bodyPercent: number
  averageMessageLength: number
  averageBodyLength: number
  mostCommonType: string | null
  examples: string[]
  messageLengthBuckets: Array<{ label: string; count: number }>
}

export type ActivityRange = 90 | 180 | 365

export type CommitActivity = {
  range: ActivityRange
  daily: Record<string, number>
  weekly: Array<{ weekStart: string; count: number }>
  topContributors: ContributorActivity[]
  weekday: number[]
  hourOfDay: number[]
  quality: CommitQuality
}

export type StoredActivity = {
  quality: CommitQuality
  commitsLast30: number
  ranges: Record<ActivityRange, Omit<CommitActivity, 'range' | 'quality'>>
}

export type ContributorShare = {
  login: string
  commits: number
  share: number
}

export type BusFactor = {
  totalCommits: number
  contributorCount: number
  top1Share: number
  top3Share: number
  top10Share: number
  gini: number
  risk: 'green' | 'yellow' | 'red'
  topContributors: ContributorShare[]
}

export type CiRun = {
  runId: number
  workflowName: string
  status: string
  conclusion: string | null
  branch: string | null
  actor: string | null
  startedAt: string | null
  completedAt: string | null
  durationSeconds: number | null
  url: string | null
}

export type CiFailure = {
  runId: number
  workflowName: string
  branch: string | null
  actor: string | null
  conclusion: string | null
  completedAt: string | null
  url: string | null
}

export type WorkflowHealth = {
  name: string
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  successRate: number
  averageDurationSeconds: number | null
}

export type CiHealth = {
  successRate: number | null
  totalRuns: number
  workflows: WorkflowHealth[]
  recentFailures: CiFailure[]
  partial: boolean
  fetchedAt: string | null
}

export type RepoHealthComponentKey =
  | 'activity'
  | 'dependencies'
  | 'ci'
  | 'concentration'
  | 'commitQuality'

export type RepoHealthComponent = {
  key: RepoHealthComponentKey
  label: string
  score: number
  weight: number
  available: boolean
}

export type RepoHealth = {
  score: number | null
  components: RepoHealthComponent[]
}

export type DependencyEcosystem =
  | 'npm'
  | 'pypi'
  | 'go'
  | 'rubygems'
  | 'packagist'

export type ParsedDependency = {
  ecosystem: DependencyEcosystem
  name: string
  version: string
}

export type CheckedDependency = ParsedDependency & {
  latestVersion: string | null
  outdated: boolean
  registryUrl: string
}

export type DependencySummary = {
  total: number
  ecosystems: Partial<Record<DependencyEcosystem, number>>
  partial: boolean
  checked: number
  outdated: number
  checkedAt: string | null
}

export type DependencyReport = DependencySummary & {
  rows: CheckedDependency[]
}

export type RepositoryReport = {
  repoFullName: string
  defaultBranch: string
  stars: number
  forks: number
  language: string | null
  description: string | null
  contributorCount: number
  metrics: RepoMetrics
  health: RepoHealth
  busFactor: BusFactor
  activity: StoredActivity
  ci: CiHealth | null
  dependencies: DependencyReport
  scannedAt: string
}
