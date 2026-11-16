import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GitHubClient } from '../src/github/client.js'
import {
  contributionCutoffDate,
  listRepos,
  shouldFetchNextRepoPage,
} from '../src/github/repos.js'

type RestRepo = {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  default_branch: string
  stargazers_count: number
  forks_count: number
  language: string | null
  description: string | null
  pushed_at: string | null
  updated_at: string | null
}

type GraphqlBody = {
  query: string
  variables: Record<string, unknown>
}

function restRepo(
  id: number,
  fullName: string,
  overrides: Partial<RestRepo> = {},
): RestRepo {
  const [owner, name] = fullName.split('/')
  return {
    id,
    name: name!,
    full_name: fullName,
    owner: { login: owner! },
    private: false,
    default_branch: 'main',
    stargazers_count: 0,
    forks_count: 0,
    language: null,
    description: null,
    pushed_at: null,
    updated_at: null,
    ...overrides,
  }
}

function contributionNode(
  id: number,
  fullName: string,
  overrides: Record<string, unknown> = {},
) {
  const [owner, name] = fullName.split('/')
  return {
    repository: {
      databaseId: id,
      name: name!,
      nameWithOwner: fullName,
      owner: { login: owner! },
      isPrivate: false,
      defaultBranchRef: { name: 'main' },
      description: null,
      primaryLanguage: null,
      pushedAt: null,
      updatedAt: null,
      stargazerCount: 0,
      forkCount: 0,
      ...overrides,
    },
  }
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-27T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('listRepos', () => {
  it('keeps owned and contributed repos but drops org access without contributions', async () => {
    const restRepos = [
      restRepo(1, 'alice/owned', {
        stargazers_count: 10,
        language: 'TypeScript',
      }),
      restRepo(2, 'carol/org-only'),
    ]
    const searchCalls: GraphqlBody[] = []
    let commitQuery = ''

    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()

        if (url === 'https://api.github.com/graphql') {
          const body = JSON.parse(String(init?.body)) as GraphqlBody

          if (body.query.includes('CommitContributedRepos')) {
            commitQuery = body.query
            return jsonResponse({
              data: {
                user: {
                  contributionsCollection: {
                    commitContributionsByRepository: [
                      contributionNode(1, 'alice/owned'),
                      contributionNode(30, 'dave/external-commit', {
                        defaultBranchRef: null,
                        stargazerCount: 3,
                      }),
                      contributionNode(99, 'skip/no-rest-id', {
                        databaseId: null,
                      }),
                    ],
                  },
                },
              },
            })
          }

          if (body.query.includes('MergedPullRequests')) {
            searchCalls.push(body)
            if (body.variables.after === null) {
              return jsonResponse({
                data: {
                  search: {
                    pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
                    nodes: [
                      contributionNode(20, 'bob/external-merged', {
                        stargazerCount: 5,
                        forkCount: 2,
                      }),
                    ],
                  },
                },
              })
            }
            return jsonResponse({
              data: {
                search: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: [
                    contributionNode(20, 'bob/external-merged'),
                    contributionNode(40, 'erin/second-merged'),
                  ],
                },
              },
            })
          }
        }

        if (url.includes('/user/repos?')) {
          return jsonResponse(restRepos)
        }

        throw new Error(`Unexpected fetch: ${url}`)
      },
    )

    const client = new GitHubClient('token', {
      fetchImpl: fetchMock as typeof fetch,
    })
    const repos = await listRepos(client, 'alice')

    expect(repos.map((repo) => repo.full_name)).toEqual([
      'dave/external-commit',
      'bob/external-merged',
      'erin/second-merged',
      'alice/owned',
    ])
    expect(repos[0]).toMatchObject({
      id: 30,
      default_branch: 'main',
      stargazers_count: 3,
    })
    expect(repos.some((repo) => repo.full_name === 'carol/org-only')).toBe(false)
    expect(repos.some((repo) => repo.full_name === 'skip/no-rest-id')).toBe(
      false,
    )

    expect(commitQuery).toContain('commitContributionsByRepository')
    expect(commitQuery).not.toContain('pullRequestContributionsByRepository')
    expect(searchCalls).toHaveLength(2)
    for (const call of searchCalls) {
      expect(call.variables.q).toBe(
        'author:alice type:pr is:merged merged:>=2025-10-27',
      )
    }
    expect(searchCalls[0]?.variables.after).toBeNull()
    expect(searchCalls[1]?.variables.after).toBe('cursor-1')
  })
})

describe('contributionCutoffDate', () => {
  it('uses a 365 day window', () => {
    expect(contributionCutoffDate(Date.parse('2026-10-27T12:00:00.000Z'))).toBe(
      '2025-10-27',
    )
  })
})

describe('shouldFetchNextRepoPage', () => {
  it('stops on a partial page or at the cap', () => {
    expect(shouldFetchNextRepoPage(100, 1)).toBe(true)
    expect(shouldFetchNextRepoPage(99, 1)).toBe(false)
    expect(shouldFetchNextRepoPage(100, 10)).toBe(false)
  })
})
