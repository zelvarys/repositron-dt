import { useEffect, useMemo, useState } from 'react'
import { Box, Text, useInput, useWindowSize } from 'ink'
import SelectInput from 'ink-select-input'
import Spinner from 'ink-spinner'
import TextInput from 'ink-text-input'
import type { GitHubClient } from '../../github/client.js'
import { listRepos, type GitHubRepo } from '../../github/repos.js'
import { compactNumber, relativeTime, truncate } from '../format.js'
import { glyphs } from '../glyphs.js'
import { border, colors } from '../theme.js'
import { Badge } from '../components/Badge.js'
import { Footer } from '../components/Footer.js'
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
      <Text color={isSelected ? colors.blue : colors.muted}>
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
  const showPreview = terminalRows >= 30
  const listLimit = Math.max(
    3,
    Math.min(showPreview ? 8 : 12, terminalRows - (showPreview ? 24 : 16)),
  )

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
    <Box flexDirection="column" flexGrow={1}>
      <Header />

      <Box
        marginTop={1}
        flexDirection="column"
        flexGrow={1}
        paddingX={1}
        overflow="hidden"
      >
        <Box justifyContent="space-between">
          <Text bold color={colors.blueSoft}>
            FIND A REPOSITORY
          </Text>
          <Text color={colors.muted}>
            {repos.length} owned or contributed
          </Text>
        </Box>

        <Box
          borderStyle={border}
          borderColor={focus === 'search' ? colors.active : colors.borderStrong}
          marginTop={1}
          paddingX={1}
        >
          <Text color={colors.blue}>{'> '}</Text>
          {focus === 'search' ? (
            <TextInput
              value={query}
              onChange={setQuery}
              onSubmit={() => setFocus('list')}
              placeholder="Search repositories"
            />
          ) : (
            <Text color={colors.muted}>
              {query || 'Type to search, or press /'}
            </Text>
          )}
        </Box>

        <Box
          borderStyle={border}
          borderColor={focus === 'list' ? colors.active : colors.borderStrong}
          flexDirection="column"
          marginTop={1}
          paddingX={1}
          overflow="hidden"
        >
          <Box justifyContent="space-between">
            <Text bold color={colors.text}>
              Repositories
            </Text>
            <Text color={colors.muted}>
              {focus === 'list'
                ? 'Press arrow keys to move'
                : 'Press Enter to focus list'}
            </Text>
          </Box>

          {loading ? (
            <Box marginY={1}>
              <Text color={colors.muted}>
                <Spinner type="dots" /> Loading owned and contributed repos...
              </Text>
            </Box>
          ) : error ? (
            <Box flexDirection="column" marginY={1}>
              <StatusMessage tone="error">{error}</StatusMessage>
              <Text color={colors.muted}>Press r to retry.</Text>
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
            borderColor={colors.borderStrong}
            flexDirection="column"
            marginTop={1}
            paddingX={1}
          >
            <Box justifyContent="space-between">
              <Text bold color={colors.blue} wrap="truncate-end">
                {highlighted.full_name}
              </Text>
              <Badge
                label={highlighted.private ? 'private' : 'public'}
                tone={highlighted.private ? colors.yellow : colors.green}
              />
            </Box>
            <Text color={colors.muted} wrap="truncate-end">
              {highlighted.description ?? 'No repository description.'}
            </Text>
            <Box justifyContent="space-between">
              <Text color={colors.muted}>
                branch{' '}
                <Text bold color={colors.blue}>
                  {truncate(highlighted.default_branch, 18)}
                </Text>
                <Text color={colors.blue}>  {glyphs.bullet}  </Text>
                stars{' '}
                <Text bold color={colors.blue}>
                  {compactNumber(highlighted.stargazers_count)}
                </Text>
                <Text color={colors.blue}>  {glyphs.bullet}  </Text>
                forks{' '}
                <Text bold color={colors.blue}>
                  {compactNumber(highlighted.forks_count)}
                </Text>
              </Text>
              <Text color={colors.muted}>
                updated {relativeTime(highlighted.updated_at)}
              </Text>
            </Box>
          </Box>
        ) : null}
      </Box>

      <Footer hints="Enter: scan  ·  /: search  ·  r: retry  ·  Ctrl+C exits" />
    </Box>
  )
}
