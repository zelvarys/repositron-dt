import { useEffect, useMemo, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import Spinner from 'ink-spinner'
import TextInput from 'ink-text-input'
import type { GitHubClient } from '../../github/client.js'
import { listRepos, type GitHubRepo } from '../../github/repos.js'
import { Header } from '../components/Header.js'
import { StatusMessage } from '../components/StatusMessage.js'

type RepoPickerProps = {
  client: GitHubClient
  username?: string
  onSelect: (repo: GitHubRepo) => void
}

type Focus = 'list' | 'search'

export function RepoPicker({ client, username, onSelect }: RepoPickerProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<Focus>('list')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    listRepos(client)
      .then((result) => {
        if (!cancelled) setRepos(result)
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : String(reason))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [client])

  useInput(
    (input) => {
      if (input.length === 1 && input >= ' ') {
        setQuery(input)
        setFocus('search')
      }
    },
    { isActive: focus === 'list' },
  )

  useInput(
    (_input, key) => {
      if (key.escape) setFocus('list')
    },
    { isActive: focus === 'search' },
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return repos
    return repos.filter((repo) =>
      repo.full_name.toLowerCase().includes(needle),
    )
  }, [repos, query])

  const items = filtered.slice(0, 50).map((repo) => ({
    key: repo.full_name,
    label: `${repo.full_name.padEnd(44)} ${String(repo.stargazers_count).padStart(
      6,
    )} stars  ${repo.language ?? 'unknown'}`,
    value: repo,
  }))

  return (
    <Box flexDirection="column">
      <Header username={username} />
      <Box
        borderStyle="single"
        borderColor="gray"
        flexDirection="column"
        paddingX={1}
        paddingY={1}
      >
        <Text bold color="cyan">
          Select a repository
        </Text>
        <Text color="gray">
          {focus === 'search'
            ? 'Type to filter. Enter or Esc returns to the list.'
            : 'Type or press / to search. Up/Down to move. Enter to scan.'}
        </Text>
        <Box marginTop={1}>
          <Text color="gray">Search: </Text>
          {focus === 'search' ? (
            <TextInput
              value={query}
              onChange={setQuery}
              onSubmit={() => setFocus('list')}
              placeholder="repository name"
            />
          ) : (
            <Text>{query || '(all repositories)'}</Text>
          )}
        </Box>

        <Box flexDirection="column" marginTop={1}>
          {loading ? (
            <Text>
              <Spinner type="dots" /> Loading repositories...
            </Text>
          ) : error ? (
            <StatusMessage tone="error">{error}</StatusMessage>
          ) : items.length === 0 ? (
            <StatusMessage tone="muted">
              No repositories match this search.
            </StatusMessage>
          ) : (
            <SelectInput
              key={query}
              items={items}
              isFocused={focus === 'list'}
              limit={12}
              onSelect={(item) => onSelect(item.value)}
              onHighlight={() => undefined}
            />
          )}
        </Box>

        {!loading && !error ? (
          <Box marginTop={1}>
            <Text color="gray">
              {filtered.length} repositories | Esc leaves search
            </Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}
