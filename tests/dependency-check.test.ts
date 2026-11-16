import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkDependencies } from '../src/insights/dependency-check.js'
import { compareVersions, isOutdated } from '../src/insights/semver.js'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('semver', () => {
  it('compares versions including prereleases', () => {
    expect(compareVersions('1.2.0', '1.3.0')).toBeLessThan(0)
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0)
    expect(compareVersions('1.0.0-beta.1', '1.0.0')).toBeLessThan(0)
  })

  it('marks any newer version as outdated', () => {
    expect(isOutdated('1.2.0', '1.2.1')).toBe(true)
    expect(isOutdated('1.2.0', '1.2.0')).toBe(false)
    expect(isOutdated('1.2.0', null)).toBe(false)
  })
})

describe('checkDependencies', () => {
  it('adds latest versions, outdated state, and OSV advisories', async () => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()

        if (url === 'https://registry.npmjs.org/react-check/latest') {
          return jsonResponse({ version: '19.0.0' })
        }
        if (url === 'https://pypi.org/pypi/requests-check/json') {
          return jsonResponse({ info: { version: '2.32.1' } })
        }
        if (url === 'https://proxy.golang.org/example.com/mod/@latest') {
          return jsonResponse({ Version: 'v1.0.0' })
        }
        if (url === 'https://registry.npmjs.org/unpinned-check/latest') {
          return jsonResponse({ version: '4.0.0' })
        }
        if (url === 'https://api.osv.dev/v1/querybatch') {
          const body = JSON.parse(String(init?.body)) as {
            queries: Array<{ package: { name: string } }>
          }
          return jsonResponse({
            results: body.queries.map((query) => {
              if (query.package.name === 'react-check') {
                return {
                  vulns: [
                    {
                      id: 'GHSA-react',
                      database_specific: { severity: 'HIGH' },
                    },
                  ],
                }
              }
              if (query.package.name === 'requests-check') {
                return {
                  vulns: [
                    {
                      id: 'GHSA-requests',
                      database_specific: { severity: 'moderate' },
                    },
                  ],
                }
              }
              return {}
            }),
          })
        }

        throw new Error(`Unexpected fetch: ${url}`)
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    const report = await checkDependencies({
      dependencies: [
        { ecosystem: 'npm', name: 'react-check', version: '18.0.0' },
        { ecosystem: 'pypi', name: 'requests-check', version: '2.0.0' },
        { ecosystem: 'go', name: 'example.com/mod', version: '1.0.0' },
        { ecosystem: 'npm', name: 'unpinned-check', version: '*' },
      ],
      partial: false,
    })

    expect(report.checked).toBe(4)
    expect(report.outdated).toBe(2)
    expect(report.advisoryCount).toBe(2)
    expect(report.severity).toEqual({
      low: 0,
      moderate: 1,
      high: 1,
      critical: 0,
    })
    expect(report.partial).toBe(false)
    expect(report.rows.find((row) => row.name === 'react-check')).toMatchObject({
      latestVersion: '19.0.0',
      outdated: true,
      advisoryCount: 1,
      maxSeverity: 'high',
    })
    expect(report.rows.find((row) => row.name === 'unpinned-check')).toMatchObject(
      {
        latestVersion: '4.0.0',
        outdated: false,
        advisoryCount: 0,
      },
    )
    expect(
      fetchMock.mock.calls.filter(
        ([url]) => String(url) === 'https://api.osv.dev/v1/querybatch',
      ),
    ).toHaveLength(1)
  })

  it('marks registry failures as partial instead of aborting the scan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('registry.npmjs.org')) {
          return jsonResponse({ error: 'nope' }, 500)
        }
        return jsonResponse({ results: [{}] })
      }),
    )

    const report = await checkDependencies({
      dependencies: [
        { ecosystem: 'npm', name: 'missing-package-check', version: '1.0.0' },
      ],
      partial: false,
    })

    expect(report.checked).toBe(0)
    expect(report.rows[0]?.latestVersion).toBeNull()
    expect(report.partial).toBe(true)
  })
})
