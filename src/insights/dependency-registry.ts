import type { ParsedDependency } from './types.js'

const TIMEOUT_MS = 10_000

type LatestResult = {
  version: string | null
  failed: boolean
}

const latestCache = new Map<string, LatestResult>()

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'repositron',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Registry ${response.status} for ${url}`)
  }
  return response.json()
}

function stripVersion(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim().replace(/^v/, '')
    : null
}

async function fetchLatestVersion(
  dependency: ParsedDependency,
): Promise<string | null> {
  const name = dependency.name
  switch (dependency.ecosystem) {
    case 'npm': {
      const data = (await fetchJson(
        `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
      )) as { version?: string }
      return stripVersion(data.version)
    }
    case 'pypi': {
      const data = (await fetchJson(
        `https://pypi.org/pypi/${encodeURIComponent(name)}/json`,
      )) as { info?: { version?: string } }
      return stripVersion(data.info?.version)
    }
    case 'go': {
      const data = (await fetchJson(
        `https://proxy.golang.org/${name}/@latest`,
      )) as { Version?: string }
      return stripVersion(data.Version)
    }
    case 'rubygems': {
      const data = (await fetchJson(
        `https://rubygems.org/api/v1/gems/${encodeURIComponent(name)}.json`,
      )) as { version?: string }
      return stripVersion(data.version)
    }
    case 'packagist': {
      const data = (await fetchJson(
        `https://repo.packagist.org/p2/${name}.json`,
      )) as { packages?: Record<string, Array<{ version?: string }>> }
      const versions = data.packages?.[name.toLowerCase()] ?? []
      const stable = versions.find(
        (entry) => entry.version && !entry.version.includes('dev'),
      )
      return stripVersion(stable?.version)
    }
  }
}

export async function getLatestVersion(
  dependency: ParsedDependency,
): Promise<LatestResult> {
  const key = `${dependency.ecosystem}:${dependency.name}`
  const cached = latestCache.get(key)
  if (cached) return cached

  try {
    const result = { version: await fetchLatestVersion(dependency), failed: false }
    latestCache.set(key, result)
    return result
  } catch {
    const result = { version: null, failed: true }
    latestCache.set(key, result)
    return result
  }
}
