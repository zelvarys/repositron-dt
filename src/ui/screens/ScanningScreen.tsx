import { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { GitHubRepo } from '../../github/repos.js'
import { colors } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Card } from '../components/Card.js'
import { Footer } from '../components/Footer.js'
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
  { match: 'dependency versions', label: 'Dependency versions' },
  { match: 'Calculating insights', label: 'Insight engine' },
] as const

function currentPhase(message: string): number {
  const index = PHASES.findIndex((phase) => message.includes(phase.match))
  return index === -1 ? 0 : index
}

export function ScanningScreen({ repo, message }: ScanningScreenProps) {
  const { columns } = useViewport()
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
    <Box flexDirection="column" flexGrow={1}>
      <Header repo={repo ?? undefined} tab="scanning" />
      <Box
        flexGrow={1}
        flexDirection="column"
        paddingX={1}
        marginTop={1}
        overflow="hidden"
      >
        <Card
          title={`Scanning ${repo?.full_name ?? 'repository'}`}
          borderColor={colors.active}
        >
          <Box justifyContent="space-between">
            <Text color={colors.muted}>
              Collecting repository signals
            </Text>
            <Text color={colors.muted}>{elapsed}s elapsed</Text>
          </Box>
          <Box marginTop={1}>
            <ProgressBar
              value={((phase + 1) / PHASES.length) * 100}
              width={Math.max(12, Math.min(48, columns - 10))}
              color={colors.blue}
            />
          </Box>

          <Box flexDirection="column" marginTop={1}>
            {PHASES.map((item, index) => {
              const done = index < phase
              const active = index === phase
              return (
                <Text
                  key={item.label}
                  color={
                    done
                      ? colors.green
                      : active
                        ? colors.blue
                        : colors.muted
                  }
                >
                  {done ? '[x]' : active ? '[>]' : '[ ]'} {item.label}
                  {active ? (
                    <Text color={colors.dim}>  {message}</Text>
                  ) : null}
                </Text>
              )
            })}
          </Box>

          <Box marginTop={1}>
            <Text color={colors.muted}>
              <Spinner type="dots" /> {message}
            </Text>
          </Box>
        </Card>
      </Box>
      <Footer hints="Ctrl+C exits" />
    </Box>
  )
}
