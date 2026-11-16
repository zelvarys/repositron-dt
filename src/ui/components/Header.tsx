import { Box, Text } from 'ink'
import Link from 'ink-link'
import type { GitHubRepo } from '../../github/repos.js'
import { border } from '../theme.js'

type HeaderProps = {
  repo?: GitHubRepo
  languages?: string[]
  tab?: string
}

export function Header({ repo, languages, tab }: HeaderProps) {
  const languageText =
    languages && languages.length > 0 ? languages.join(' / ') : 'unknown'
  const url = repo ? `https://github.com/${repo.full_name}` : null

  return (
    <Box
      borderStyle={border}
      borderColor="cyan"
      flexDirection="column"
      paddingX={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          {'[>_]'} REPOSITRON
        </Text>
        <Text color="white">{tab ? tab.toUpperCase() : ' '}</Text>
      </Box>
      {repo && url ? (
        <Box justifyContent="space-between">
          <Text>
            <Link url={url}>{`github.com/${repo.full_name}`}</Link>
            {repo.private ? <Text color="yellow">  private</Text> : null}
          </Text>
          <Text color="white">
            {repo.stargazers_count} stars  {languageText}
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}
