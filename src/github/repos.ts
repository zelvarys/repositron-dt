import type { GitHubClient } from './client.js'

export type GitHubRepo = {
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

type ContributedRepository = {
  databaseId: number | null
  name: string
  nameWithOwner: string
  owner: { login: string }
  isPrivate: boolean
  defaultBranchRef: { name: string } | null
  description: string | null
  primaryLanguage: { name: string } | null
  pushedAt: string | null
  updatedAt: string | null
  stargazerCount: number
  forkCount: number
}

type ContributedRepoNode = {
  repository: ContributedRepository
}

type CommitContributionsResult = {
  user: {
    contributionsCollection: {
      commitContributionsByRepository: ContributedRepoNode[]
    } | null
  } | null
}

type MergedPullRequestsResult = {
  search: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: Array<ContributedRepoNode | null>
  }
}

const CONTRIBUTED_REPOSITORY_FRAGMENT = `
  fragment ContributedRepository on Repository {
    databaseId
    name
    nameWithOwner
    owner { login }
    isPrivate
    defaultBranchRef { name }
    description
    primaryLanguage { name }
    pushedAt
    updatedAt
    stargazerCount
    forkCount
  }
`

const COMMIT_CONTRIBUTIONS_QUERY = `
  ${CONTRIBUTED_REPOSITORY_FRAGMENT}

  query CommitContributedRepos($login: String!) {
    user(login: $login) {
      contributionsCollection {
        commitContributionsByRepository(maxRepositories: 100) {
          repository { ...ContributedRepository }
        }
      }
    }
  }
`

const MERGED_PULL_REQUESTS_QUERY = `
  ${CONTRIBUTED_REPOSITORY_FRAGMENT}

  query MergedPullRequests($q: String!, $after: String) {
    search(query: $q, type: ISSUE, first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on PullRequest {
          repository { ...ContributedRepository }
        }
      }
    }
  }
`

const MAX_REPO_PAGES = 10
const MAX_CONTRIBUTED_REPOS = 100
const MAX_SEARCH_PAGES = 10
const CONTRIBUTION_WINDOW_DAYS = 365
const PER_PAGE = 100

export function contributionCutoffDate(now = Date.now()): string {
  return new Date(
    now - CONTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10)
}

export function shouldFetchNextRepoPage(
  rawPageSize: number,
  currentPage: number,
  maxPages = MAX_REPO_PAGES,
  perPage = PER_PAGE,
): boolean {
  return rawPageSize === perPage && currentPage < maxPages
}

function toGitHubRepo(repo: ContributedRepository): GitHubRepo | null {
  if (repo.databaseId === null) return null
  return {
    id: repo.databaseId,
    name: repo.name,
    full_name: repo.nameWithOwner,
    owner: { login: repo.owner.login },
    private: repo.isPrivate,
    default_branch: repo.defaultBranchRef?.name ?? 'main',
    stargazers_count: repo.stargazerCount,
    forks_count: repo.forkCount,
    language: repo.primaryLanguage?.name ?? null,
    description: repo.description,
    pushed_at: repo.pushedAt,
    updated_at: repo.updatedAt,
  }
}

function addContributedRepo(
  repos: Map<string, GitHubRepo>,
  repo: ContributedRepository,
): void {
  const mapped = toGitHubRepo(repo)
  if (mapped && !repos.has(mapped.full_name)) {
    repos.set(mapped.full_name, mapped)
  }
}

async function fetchMergedPullRequestRepos(
  client: GitHubClient,
  username: string,
): Promise<GitHubRepo[]> {
  const repos = new Map<string, GitHubRepo>()
  const cutoff = contributionCutoffDate()
  const query = `author:${username} type:pr is:merged merged:>=${cutoff}`
  let after: string | null = null

  for (let page = 0; page < MAX_SEARCH_PAGES; page += 1) {
    const data: MergedPullRequestsResult =
      await client.graphql<MergedPullRequestsResult>(
        MERGED_PULL_REQUESTS_QUERY,
        { q: query, after },
      )

    for (const node of data.search.nodes) {
      if (node) addContributedRepo(repos, node.repository)
    }

    if (repos.size >= MAX_CONTRIBUTED_REPOS) break
    if (!data.search.pageInfo.hasNextPage) break

    after = data.search.pageInfo.endCursor
    if (!after) break
  }

  return [...repos.values()]
}

async function fetchContributedRepos(
  client: GitHubClient,
  username: string,
): Promise<GitHubRepo[]> {
  const [commits, mergedPullRequests] = await Promise.all([
    client.graphql<CommitContributionsResult>(COMMIT_CONTRIBUTIONS_QUERY, {
      login: username,
    }),
    fetchMergedPullRequestRepos(client, username),
  ])

  const repos = new Map<string, GitHubRepo>()
  const commitNodes =
    commits.user?.contributionsCollection?.commitContributionsByRepository ??
    []
  for (const node of commitNodes) {
    addContributedRepo(repos, node.repository)
  }
  for (const repo of mergedPullRequests) {
    if (!repos.has(repo.full_name)) repos.set(repo.full_name, repo)
  }

  return [...repos.values()]
}

/**
 * Repositories owned by the user, plus repositories they actually contributed
 * to in the last year. Organization access alone is not enough.
 */
export async function listRepos(
  client: GitHubClient,
  username: string,
): Promise<GitHubRepo[]> {
  const contributed = await fetchContributedRepos(client, username)
  const contributedNames = new Set(contributed.map((repo) => repo.full_name))
  const listed: GitHubRepo[] = []
  const seen = new Set<string>()

  for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
    const batch = await client.get<GitHubRepo[]>(
      `/user/repos?per_page=${PER_PAGE}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
    )

    for (const repo of batch) {
      if (
        repo.owner.login !== username &&
        !contributedNames.has(repo.full_name)
      ) {
        continue
      }
      if (seen.has(repo.full_name)) continue
      seen.add(repo.full_name)
      listed.push(repo)
    }

    if (!shouldFetchNextRepoPage(batch.length, page)) break
  }

  const external = contributed.filter((repo) => !seen.has(repo.full_name))
  return [...external, ...listed]
}

export async function getRepo(
  client: GitHubClient,
  owner: string,
  repo: string,
): Promise<GitHubRepo> {
  return client.get<GitHubRepo>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  )
}

export function parseRepoFullName(fullName: string): {
  owner: string
  name: string
} | null {
  const [owner, name, ...rest] = fullName.split('/')
  if (!owner || !name || rest.length > 0) return null
  return { owner, name }
}
