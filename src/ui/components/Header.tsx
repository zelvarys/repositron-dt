import { Box, Text } from 'ink'
import type { GitHubRepo } from '../../github/repos.js'
import { compactNumber, truncate } from '../format.js'
import { colors } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Rule } from './Rule.js'

type HeaderProps = {
  repo?: GitHubRepo
  languages?: string[]
  tab?: string
}

export function Header({ repo, languages, tab }: HeaderProps) {
  const { columns } = useViewport()
  const languageText =
    languages && languages.length > 0 ? languages.join(' / ') : 'unknown'
  const right = repo
    ? `${repo.private ? 'private · ' : ''}${compactNumber(
        repo.stargazers_count,
      )} stars · ${languageText}`
    : 'GitHub repository dashboard'
  const rightText = truncate(right, Math.max(12, Math.floor(columns * 0.42)))
  const repoText = truncate(
    repo?.full_name ?? '',
    Math.max(8, columns - rightText.length - 3),
  )
  const tabText = (tab ?? 'select repository').toUpperCase()

  return (
    <Box flexDirection="column" flexShrink={0}>
      <Box flexDirection="column" paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold color={colors.blue}>
            {'[>_]'} REPOSITRON
          </Text>
          <Text color={colors.muted} wrap="truncate-end">
            {tabText}
          </Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color={colors.text}>{repoText || ' '}</Text>
          <Text color={colors.muted} wrap="truncate-end">
            {rightText}
          </Text>
        </Box>
      </Box>
      <Rule />
    </Box>
  )
}
