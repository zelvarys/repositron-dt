import type {
  DependencyAdvisory,
  DependencyEcosystem,
  DependencySeverity,
  ParsedDependency,
} from './types.js'

const TIMEOUT_MS = 10_000
const BATCH_SIZE = 100

const advisoriesCache = new Map<string, DependencyAdvisory[]>()

export type AdvisoryLookup = {
  advisories: Map<string, DependencyAdvisory[]>
  partial: boolean
}

const OSV_ECOSYSTEMS: Record<DependencyEcosystem, string> = {
  npm: 'npm',
  pypi: 'PyPI',
  go: 'Go',
  rubygems: 'RubyGems',
  packagist: 'Packagist',
}

export function dependencyKey(dependency: ParsedDependency): string {
  return `${dependency.ecosystem}:${dependency.name}@${dependency.version}`
}

function normalizeSeverity(value: unknown): DependencySeverity | null {
  if (typeof value !== 'string') return null
  const severity = value.toLowerCase()
  if (severity === 'low') return 'low'
  if (severity === 'moderate' || severity === 'medium') return 'moderate'
  if (severity === 'high') return 'high'
  if (severity === 'critical') return 'critical'
  return null
}

function severityFor(
  vulnerability: Record<string, unknown>,
): DependencySeverity | null {
  const databaseSpecific = vulnerability.database_specific
  if (databaseSpecific && typeof databaseSpecific === 'object') {
    return normalizeSeverity(
      (databaseSpecific as Record<string, unknown>).severity,
    )
  }
  return null
}

async function queryBatch(
  dependencies: ParsedDependency[],
): Promise<{ results: DependencyAdvisory[][]; partial: boolean }> {
  const response = await fetch('https://api.osv.dev/v1/querybatch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'repositron',
    },
    body: JSON.stringify({
      queries: dependencies.map((dependency) => ({
        package: {
          name: dependency.name,
          ecosystem: OSV_ECOSYSTEMS[dependency.ecosystem],
        },
        version: dependency.version,
      })),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`OSV ${response.status}`)
  }

  const data = (await response.json()) as {
    results?: Array<{
      vulns?: Array<{
        id?: string
        database_specific?: Record<string, unknown>
      }>
    }>
  }
  const results = data.results ?? []
  return {
    results: dependencies.map((_, index) => {
      const vulnerabilities = results[index]?.vulns ?? []
      return vulnerabilities
        .filter((vulnerability) => typeof vulnerability.id === 'string')
        .map((vulnerability) => ({
          id: vulnerability.id!,
          severity: severityFor(vulnerability as Record<string, unknown>),
        }))
    }),
    partial: results.length !== dependencies.length,
  }
}

export async function lookupAdvisories(
  dependencies: ParsedDependency[],
): Promise<AdvisoryLookup> {
  const advisories = new Map<string, DependencyAdvisory[]>()
  const missing: ParsedDependency[] = []

  for (const dependency of dependencies) {
    const key = dependencyKey(dependency)
    const cached = advisoriesCache.get(key)
    if (cached) {
      advisories.set(key, cached)
      continue
    }
    missing.push(dependency)
  }

  let partial = false
  for (let start = 0; start < missing.length; start += BATCH_SIZE) {
    const batch = missing.slice(start, start + BATCH_SIZE)
    try {
      const result = await queryBatch(batch)
      partial ||= result.partial
      batch.forEach((dependency, index) => {
        const found = result.results[index] ?? []
        advisories.set(dependencyKey(dependency), found)
        advisoriesCache.set(dependencyKey(dependency), found)
      })
    } catch {
      partial = true
      for (const dependency of batch) {
        advisories.set(dependencyKey(dependency), [])
      }
    }
  }

  return { advisories, partial }
}

export function maxSeverity(
  advisories: DependencyAdvisory[],
): DependencySeverity | null {
  const order: DependencySeverity[] = ['low', 'moderate', 'high', 'critical']
  let result: DependencySeverity | null = null
  for (const advisory of advisories) {
    if (!advisory.severity) continue
    if (
      result === null ||
      order.indexOf(advisory.severity) > order.indexOf(result)
    ) {
      result = advisory.severity
    }
  }
  return result
}
