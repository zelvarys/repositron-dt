import {
  parseDependencies,
  registryUrl,
  type ParseResult,
} from './dependencies.js'
import { getLatestVersion } from './dependency-registry.js'
import { isOutdated } from './semver.js'
import type {
  CheckedDependency,
  DependencyReport,
  DependencySummary,
  ParsedDependency,
} from './types.js'

const MAX_DEPENDENCIES = 300
const CONCURRENCY = 8

export type DependencyProgress = (message: string) => void

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
      checkedAt,
      rows: [],
    }
  }

  onProgress(`Checking ${dependencies.length} dependency versions...`)
  const latest = await mapWithConcurrency(
    dependencies,
    CONCURRENCY,
    getLatestVersion,
  )

  let outdated = 0
  let checked = 0
  let lookupFailures = 0

  const rows: CheckedDependency[] = dependencies.map((dependency, index) => {
    const lookup = latest[index]!
    const version = lookup.version
    const outdatedDependency = isOutdated(dependency.version, version)

    if (version !== null) checked += 1
    if (lookup.failed) lookupFailures += 1
    if (outdatedDependency) outdated += 1

    return {
      ...dependency,
      latestVersion: version,
      outdated: outdatedDependency,
      registryUrl: registryUrl(dependency),
    }
  })

  return {
    total: dependencies.length,
    ecosystems: countEcosystems(dependencies),
    partial:
      parsed.partial ||
      truncated ||
      lookupFailures > 0 ||
      checked < dependencies.length,
    checked,
    outdated,
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
