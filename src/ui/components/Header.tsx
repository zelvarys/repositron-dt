import { Box, Text } from 'ink'
import Link from 'ink-link'
import type { GitHubRepo } from '../../github/repos.js'
import { border } from '../theme.js'

type HeaderProps = {
  repo?: GitHubRepo
  languages?: string[]
  username?: string
  tab?: string
}

export function Header({ repo, languages, username, tab }: HeaderProps) {
  const languageText =
    languages && languages.length > 0 ? languages.join(' / ') : 'unknown'
  return (
    <Box
      borderStyle={border}
      borderColor="cyan"
      flexDirection="column"
      paddingX={1}
    >
      <Box justifyContent="space-between">
        <Text>
          <Text bold color="cyan">
            {'[>_]'} REPOSITRON
          </Text>
          <Text color="gray">  repository intelligence</Text>
        </Text>
        <Text color="gray">
          {tab ? `${tab.toUpperCase()}  ` : ''}
          {username ? `@${username}` : 'local'}
        </Text>
      </Box>
      {repo ? (
        <Box justifyContent="space-between">
          <Text>
            <Link url={`https://github.com/${repo.full_name}`}>
              {repo.full_name}
            </Link>
            {repo.private ? <Text color="yellow">  private</Text> : null}
          </Text>
          <Text color="gray">
            {repo.stargazers_count} stars  {languageText}
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}
