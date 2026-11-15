import { Box, Text } from 'ink'
import Link from 'ink-link'
import type { GitHubRepo } from '../../github/repos.js'

type HeaderProps = {
  repo?: GitHubRepo
  languages?: string[]
  username?: string
}

export function Header({ repo, languages, username }: HeaderProps) {
  const languageText = languages && languages.length > 0 ? languages.join(', ') : 'unknown'
  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      justifyContent="space-between"
    >
      <Text>
        <Text bold color="cyan">
          Repositron
        </Text>
        <Text color="gray"> | </Text>
        {repo ? (
          <Link url={`https://github.com/${repo.full_name}`}>
            {repo.full_name}
          </Link>
        ) : (
          <Text color="gray">GitHub repository dashboard</Text>
        )}
      </Text>
      <Text color="gray">
        {repo
          ? `${repo.stargazers_count} stars | ${languageText}`
          : username
            ? `@${username}`
            : ''}
      </Text>
    </Box>
  )
}
