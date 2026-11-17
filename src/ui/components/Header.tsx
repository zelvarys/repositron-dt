import { Box, Text } from 'ink'
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

  return (
    <Box
      borderStyle={border}
      borderColor="blue"
      flexDirection="column"
      paddingX={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="blue">
          {'[>_]'} REPOSITRON
        </Text>
        <Text color="white">{tab ? tab.toUpperCase() : ' '}</Text>
      </Box>
      {repo ? (
        <Box justifyContent="space-between">
          <Text color="white">{repo.full_name}</Text>
          <Text color="white">
            {repo.private ? <Text color="yellow">private  </Text> : null}
            {repo.stargazers_count} stars  {languageText}
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}
