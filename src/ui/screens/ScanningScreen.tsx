import { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { GitHubRepo } from '../../github/repos.js'
import { border } from '../theme.js'
import { Header } from '../components/Header.js'
import { ProgressBar } from '../components/ProgressBar.js'

type ScanningScreenProps = {
  repo: GitHubRepo | null
  message: string
}

const PHASES = [
  { match: 'contributors and commit history', label: 'Repository history' },
  { match: 'commit diffs', label: 'Commit diffs' },
  { match: 'configuration files', label: 'Configuration files' },
  { match: 'workflow definitions', label: 'Workflow definitions' },
  { match: 'workflow runs', label: 'Workflow history' },
  { match: 'dependency versions', label: 'Dependency intelligence' },
  { match: 'Calculating insights', label: 'Insight engine' },
] as const

function currentPhase(message: string): number {
  const index = PHASES.findIndex((phase) => message.includes(phase.match))
  return index === -1 ? 0 : index
}

export function ScanningScreen({ repo, message }: ScanningScreenProps) {
  const [elapsed, setElapsed] = useState(0)
  const phase = currentPhase(message)

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Box flexDirection="column">
      <Header repo={repo ?? undefined} tab="scanning" />
      <Box
        borderStyle={border}
        borderColor="blue"
        flexDirection="column"
        marginTop={1}
        paddingX={2}
        paddingY={1}
      >
        <Box justifyContent="space-between">
          <Text bold color="blue">
            SCANNING {repo?.full_name ?? 'repository'}
          </Text>
          <Text color="white">{elapsed}s elapsed</Text>
        </Box>
        <Box marginTop={1}>
          <ProgressBar
            value={((phase + 1) / PHASES.length) * 100}
            width={36}
            color="blue"
          />
        </Box>

        <Box flexDirection="column" marginTop={1}>
          {PHASES.map((item, index) => {
            const done = index < phase
            const active = index === phase
            return (
              <Text
                key={item.label}
                color={done ? 'green' : active ? 'blue' : 'white'}
              >
                {done ? '[x]' : active ? '[>]' : '[ ]'} {item.label}
                {active ? <Text color="white">  {message}</Text> : null}
              </Text>
            )
          })}
        </Box>

        <Box marginTop={1} justifyContent="space-between">
          <Text>
            <Spinner type="dots" /> {message}
          </Text>
          <Text color="white">Press Ctrl+C to exit</Text>
        </Box>
      </Box>
    </Box>
  )
}
