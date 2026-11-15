import type {
  BusFactor,
  CommitQuality,
  RepoHealth,
  RepoHealthComponent,
} from './types.js'

export type HealthInput = {
  commitsLast90: number
  ciSuccessRate?: number | null
  ciTotalRuns?: number | null
  busFactor?: BusFactor | null
  quality?: CommitQuality | null
}

const WEIGHTS = {
  activity: 0.3,
  ci: 0.25,
  concentration: 0.25,
  commitQuality: 0.2,
} as const

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function componentScores(input: HealthInput): {
  activity: number
  ci: number | null
  concentration: number | null
  commitQuality: number | null
} {
  const ci =
    input.ciTotalRuns && input.ciTotalRuns > 0 && input.ciSuccessRate !== null
      ? clamp(input.ciSuccessRate ?? 0)
      : null
  const concentration = input.busFactor
    ? clamp((1 - input.busFactor.gini) * 100)
    : null
  const commitQuality =
    input.quality && input.quality.totalCommits > 0
      ? clamp(
          (input.quality.conventionalPercent + input.quality.bodyPercent) / 2,
        )
      : null

  return {
    activity: clamp((input.commitsLast90 / 50) * 100),
    ci,
    concentration,
    commitQuality,
  }
}

export function computeRepoHealth(input: HealthInput): RepoHealth {
  const scores = componentScores(input)
  const definitions: Array<{
    key: Exclude<RepoHealthComponent['key'], 'dependencies'>
    label: string
    score: number | null
  }> = [
    { key: 'activity', label: 'Activity', score: scores.activity },
    { key: 'ci', label: 'Workflow stability', score: scores.ci },
    {
      key: 'concentration',
      label: 'Contributor spread',
      score: scores.concentration,
    },
    {
      key: 'commitQuality',
      label: 'Commit quality',
      score: scores.commitQuality,
    },
  ]

  const components: RepoHealthComponent[] = definitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    score: definition.score === null ? 0 : round2(definition.score),
    weight: WEIGHTS[definition.key],
    available: definition.score !== null,
  }))

  const available = components.filter((component) => component.available)
  const totalWeight = available.reduce(
    (sum, component) => sum + component.weight,
    0,
  )
  const score =
    totalWeight === 0
      ? null
      : round2(
          available.reduce(
            (sum, component) => sum + component.score * component.weight,
            0,
          ) / totalWeight,
        )

  return { score, components }
}
