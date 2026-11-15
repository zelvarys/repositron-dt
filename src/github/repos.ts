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

const MAX_REPO_PAGES = 3
const PER_PAGE = 100

export async function listRepos(client: GitHubClient): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = []
  const seen = new Set<string>()

  for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
    const batch = await client.get<GitHubRepo[]>(
      `/user/repos?sort=updated&per_page=${PER_PAGE}&page=${page}&affiliation=owner,collaborator,organization_member`,
    )

    for (const repo of batch) {
      if (seen.has(repo.full_name)) continue
      seen.add(repo.full_name)
      repos.push(repo)
    }

    if (batch.length < PER_PAGE) break
  }

  return repos
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
