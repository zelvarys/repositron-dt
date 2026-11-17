const API_URL = 'https://api.github.com'
const DEFAULT_TIMEOUT_MS = 20_000

export type GitHubUser = {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

export class GitHubApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
  }
}

export class GitHubAuthError extends GitHubApiError {
  constructor(message = 'GitHub rejected the access token.') {
    super(message, 401)
    this.name = 'GitHubAuthError'
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  readonly resetAt: Date

  constructor(resetAt: Date) {
    super(
      `GitHub rate limit exhausted. Resets at ${resetAt.toISOString()}.`,
      403,
    )
    this.name = 'GitHubRateLimitError'
    this.resetAt = resetAt
  }
}

export class GitHubTimeoutError extends GitHubApiError {
  constructor(label: string, timeoutMs: number) {
    super(`GitHub request timed out after ${timeoutMs}ms: ${label}`, 504)
    this.name = 'GitHubTimeoutError'
  }
}

export type GitHubClientOptions = {
  baseUrl?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export class GitHubClient {
  private readonly token: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch

  constructor(token: string, options: GitHubClientOptions = {}) {
    this.token = token
    this.baseUrl = options.baseUrl ?? API_URL
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'repositron',
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new GitHubTimeoutError(path, this.timeoutMs)
      }
      throw error
    }

    if (!response.ok) {
      const body = await response.text()
      const remaining = response.headers.get('x-ratelimit-remaining')
      if (response.status === 401) {
        throw new GitHubAuthError()
      }
      if (
        (response.status === 403 || response.status === 429) &&
        remaining === '0'
      ) {
        const reset = Number(response.headers.get('x-ratelimit-reset'))
        throw new GitHubRateLimitError(
          new Date(Number.isFinite(reset) ? reset * 1000 : Date.now()),
        )
      }
      throw new GitHubApiError(
        `GitHub API ${response.status} on ${path}: ${body.slice(0, 200)}`,
        response.status,
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path)
  }

  async graphql<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const result = await this.request<{
      data?: T
      errors?: Array<{ message: string }>
    }>('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })

    if (result.errors && result.errors.length > 0) {
      throw new GitHubApiError(
        `GitHub GraphQL error: ${result.errors[0]!.message}`,
        502,
      )
    }
    if (!result.data) {
      throw new GitHubApiError('GitHub GraphQL returned no data', 502)
    }
    return result.data
  }
}

export async function getAuthenticatedUser(
  client: GitHubClient,
): Promise<GitHubUser> {
  return client.get<GitHubUser>('/user')
}
