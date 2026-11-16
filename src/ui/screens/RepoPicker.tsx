import { useEffect, useMemo, useState } from 'react'
import { Box, Text, useInput, useWindowSize } from 'ink'
import SelectInput from 'ink-select-input'
import Spinner from 'ink-spinner'
import TextInput from 'ink-text-input'
import type { GitHubClient } from '../../github/client.js'
import { listRepos, type GitHubRepo } from '../../github/repos.js'
import { compactNumber, relativeTime, truncate } from '../format.js'
import { glyphs } from '../glyphs.js'
import { border } from '../theme.js'
import { Badge } from '../components/Badge.js'
import { Header } from '../components/Header.js'
import { StatusMessage } from '../components/StatusMessage.js'

type RepoPickerProps = {
  client: GitHubClient
  username: string
  onSelect: (repo: GitHubRepo) => void
}

type Focus = 'list' | 'search'

function Pointer({ isSelected = false }: { isSelected?: boolean }) {
  return (
    <Box marginRight={1}>
      <Text color={isSelected ? 'blue' : 'white'}>
        {isSelected ? glyphs.pointer : ' '}
      </Text>
    </Box>
  )
}

export function RepoPicker({ client, username, onSelect }: RepoPickerProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<Focus>('list')
  const [reload, setReload] = useState(0)
  const [highlighted, setHighlighted] = useState<GitHubRepo | null>(null)
  const { rows: terminalRows } = useWindowSize()
  const listLimit = Math.max(3, Math.min(10, terminalRows - 19))
  const showPreview = terminalRows >= 23

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    listRepos(client, username)
      .then((result) => {
        if (cancelled) return
        setRepos(result)
        setHighlighted(result[0] ?? null)
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
  }, [client, username, reload])

  useInput(
    (input) => {
      if (input === '/') {
        setQuery('')
        setFocus('search')
        return
      }
      if (input.length === 1 && input >= ' ') {
        setQuery(input)
        setFocus('search')
      }
    },
    { isActive: focus === 'list' && !loading && !error },
  )

  useInput(
    (_input, key) => {
      if (key.escape) setFocus('list')
    },
    { isActive: focus === 'search' },
  )

  useInput(
    (input) => {
      if (input === 'r') setReload((value) => value + 1)
    },
    { isActive: Boolean(error) },
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return repos
    return repos.filter((repo) =>
      repo.full_name.toLowerCase().includes(needle),
    )
  }, [repos, query])

  const items = filtered.map((repo) => ({
    key: repo.full_name,
    label: `${truncate(repo.full_name, 40).padEnd(40)}  ${compactNumber(
      repo.stargazers_count,
    ).padStart(5)} stars  ${repo.language ?? '--'}${
      repo.private ? '  [private]' : ''
    }`,
    value: repo,
  }))

  return (
    <Box flexDirection="column">
      <Header />
      <Box marginTop={1} flexDirection="column">
        <Box justifyContent="space-between" paddingX={1}>
          <Text bold color="blue">
            FIND A REPOSITORY
          </Text>
          <Text color="white">
            {repos.length} owned or contributed repos
          </Text>
        </Box>

        <Box
          borderStyle={border}
          borderColor={focus === 'search' ? 'blue' : 'white'}
          marginTop={1}
          paddingX={1}
        >
          <Text color="blue">{'> '}</Text>
          {focus === 'search' ? (
            <TextInput
              value={query}
              onChange={setQuery}
              onSubmit={() => setFocus('list')}
              placeholder="Search repositories"
            />
          ) : (
            <Text color={query ? undefined : 'white'}>
              {query || 'Type to search, or press /'}
            </Text>
          )}
        </Box>

        <Box
          borderStyle={border}
          borderColor={focus === 'list' ? 'blue' : 'white'}
          flexDirection="column"
          marginTop={1}
          paddingX={1}
        >
          <Box justifyContent="space-between">
            <Text bold>Repositories</Text>
            <Text color="white">
              {focus === 'list' ? 'arrow keys to move' : 'enter to focus list'}
            </Text>
          </Box>

          {loading ? (
            <Box marginY={1}>
              <Text>
                <Spinner type="dots" /> Loading owned and contributed repos...
              </Text>
            </Box>
          ) : error ? (
            <Box flexDirection="column" marginY={1}>
              <StatusMessage tone="error">{error}</StatusMessage>
              <Text color="white">Press r to retry.</Text>
            </Box>
          ) : items.length === 0 ? (
            <Box marginY={1}>
              <StatusMessage tone="muted">
                No repositories match this search.
              </StatusMessage>
            </Box>
          ) : (
            <SelectInput
              key={query}
              items={items}
              isFocused={focus === 'list'}
              limit={listLimit}
              indicatorComponent={Pointer}
              onSelect={(item) => onSelect(item.value)}
              onHighlight={(item) => setHighlighted(item.value)}
            />
          )}
        </Box>

        {highlighted && !loading && !error && showPreview ? (
          <Box
            borderStyle={border}
            borderColor="gray"
            flexDirection="column"
            marginTop={1}
            paddingX={1}
          >
            <Box justifyContent="space-between">
              <Text bold color="blue">
                {highlighted.full_name}
              </Text>
              <Badge
                label={highlighted.private ? 'private' : 'public'}
                tone={highlighted.private ? 'yellow' : 'green'}
              />
            </Box>
            <Text color="white">
              {highlighted.description ?? 'No repository description.'}
            </Text>
            <Box justifyContent="space-between">
              <Text color="white">
                branch {highlighted.default_branch}  {glyphs.star}{' '}
                {compactNumber(highlighted.stargazers_count)}  forks{' '}
                {compactNumber(highlighted.forks_count)}
              </Text>
              <Text color="white">
                updated {relativeTime(highlighted.updated_at)}
              </Text>
            </Box>
          </Box>
        ) : null}

        <Box marginTop={1} paddingX={1} justifyContent="space-between">
          <Text color="white">
            {filtered.length} match{filtered.length === 1 ? '' : 'es'}  |  Press Esc
            to leave search
          </Text>
          <Text color="white">Press Enter to scan  |  Press Ctrl+C to exit</Text>
        </Box>
      </Box>
    </Box>
  )
}
