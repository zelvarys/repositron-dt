import {
  ANY_VERSION,
  parseDependencies,
  registryUrl,
  type ParseResult,
} from './dependencies.js'
import { getLatestVersion } from './dependency-registry.js'
import {
  dependencyKey,
  lookupAdvisories,
  maxSeverity,
  type AdvisoryLookup,
} from './osv.js'
import { isOutdated } from './semver.js'
import type {
  CheckedDependency,
  DependencyReport,
  DependencySeverity,
  DependencySummary,
  ParsedDependency,
} from './types.js'

const MAX_DEPENDENCIES = 300
const CONCURRENCY = 8

export type DependencyProgress = (message: string) => void

function emptySeverity(): Record<DependencySeverity, number> {
  return { low: 0, moderate: 0, high: 0, critical: 0 }
}

function countEcosystems(
  dependencies: ParsedDependency[],
): DependencySummary['ecosystems'] {
  const ecosystems: DependencySummary['ecosystems'] = {}
  for (const dependency of dependencies) {
    ecosystems[dependency.ecosystem] =
      (ecosystems[dependency.ecosystem] ?? 0) + 1
  }
  return ecosystems
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index]!)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  )
  return results
}

export async function checkDependencies(
  parsed: ParseResult,
  onProgress: DependencyProgress = () => undefined,
): Promise<DependencyReport> {
  const dependencies = parsed.dependencies.slice(0, MAX_DEPENDENCIES)
  const truncated = parsed.dependencies.length > dependencies.length
  const checkedAt = new Date().toISOString()

  if (dependencies.length === 0) {
    return {
      total: 0,
      ecosystems: {},
      partial: parsed.partial,
      checked: 0,
      outdated: 0,
      advisoryCount: 0,
      severity: emptySeverity(),
      checkedAt,
      rows: [],
    }
  }

  onProgress(`Checking ${dependencies.length} dependency versions...`)
  const confidential = dependencies.filter(
    (dependency) => dependency.version !== ANY_VERSION,
  )

  const [latest, osv] = await Promise.all([
    mapWithConcurrency(dependencies, CONCURRENCY, (dependency) =>
      getLatestVersion(dependency),
    ),
    confidential.length > 0
      ? lookupAdvisories(confidential)
      : Promise.resolve<AdvisoryLookup>({
          advisories: new Map(),
          partial: false,
        }),
  ])

  const severity = emptySeverity()
  let outdated = 0
  let advisoryCount = 0
  let checked = 0
  let lookupFailures = 0

  const rows: CheckedDependency[] = dependencies.map((dependency, index) => {
    const lookup = latest[index]!
    const version = lookup.version
    const advisories =
      dependency.version === ANY_VERSION
        ? []
        : (osv.advisories.get(dependencyKey(dependency)) ?? [])
    const outdatedDependency = isOutdated(dependency.version, version)
    const highest = maxSeverity(advisories)

    if (version !== null) checked += 1
    if (lookup.failed) lookupFailures += 1
    if (outdatedDependency) outdated += 1
    advisoryCount += advisories.length
    for (const advisory of advisories) {
      if (advisory.severity) severity[advisory.severity] += 1
    }

    return {
      ...dependency,
      latestVersion: version,
      outdated: outdatedDependency,
      advisoryCount: advisories.length,
      maxSeverity: highest,
      advisories,
      registryUrl: registryUrl(dependency),
    }
  })

  return {
    total: dependencies.length,
    ecosystems: countEcosystems(dependencies),
    partial:
      parsed.partial ||
      truncated ||
      osv.partial ||
      lookupFailures > 0 ||
      checked < dependencies.length,
    checked,
    outdated,
    advisoryCount,
    severity,
    checkedAt,
    rows,
  }
}

export async function collectDependencyHealth(
  configFiles: Record<string, string>,
  onProgress: DependencyProgress = () => undefined,
): Promise<DependencyReport> {
  return checkDependencies(parseDependencies(configFiles), onProgress)
}
