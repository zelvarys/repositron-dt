import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { percent, relativeTime, truncate } from '../format.js'
import { scoreColor } from '../theme.js'
import { Badge } from '../components/Badge.js'
import { ProgressBar } from '../components/ProgressBar.js'
import { StatCard } from '../components/StatCard.js'

type CiTabProps = {
  report: RepositoryReport
}

function duration(value: number | null): string {
  if (value === null) return 'n/a'
  if (value < 60) return `${value}s`
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
}

export function CiTab({ report }: CiTabProps) {
  const ci = report.ci
  if (!ci) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          CI HEALTH
        </Text>
        <Text color="gray">No GitHub Actions workflows found.</Text>
      </Box>
    )
  }

  const success = ci.successRate

  return (
    <Box flexDirection="column">
      <Box>
        <StatCard
          title="Success rate"
          value={success === null ? 'n/a' : percent(success, 1)}
          detail={`${ci.totalRuns} completed runs`}
          tone={scoreColor(success)}
        >
          <Box marginTop={1}>
            <ProgressBar
              value={success ?? 0}
              width={20}
              color={scoreColor(success)}
            />
          </Box>
        </StatCard>
        <Box width={1} />
        <StatCard
          title="Workflows"
          value={String(ci.workflows.length)}
          detail="tracked workflows"
          tone="cyan"
        />
        <Box width={1} />
        <StatCard
          title="Recent failures"
          value={String(ci.recentFailures.length)}
          detail="in the last run window"
          tone={ci.recentFailures.length > 0 ? 'red' : 'green'}
        >
          {ci.partial ? (
            <Box marginTop={1}>
              <Badge label="partial run history" tone="yellow" />
            </Box>
          ) : null}
        </StatCard>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          WORKFLOWS
        </Text>
        <Text color="gray">
          {'Workflow'.padEnd(30)}
          {'Success'.padStart(9)}
          {'Runs'.padStart(6)}
          {'Average'.padStart(10)}
        </Text>
        {ci.workflows.length === 0 ? (
          <Text color="gray">No completed workflow data.</Text>
        ) : (
          ci.workflows.map((workflow) => (
            <Box key={workflow.name}>
              <Box width={30}>
                <Text>{truncate(workflow.name, 29)}</Text>
              </Box>
              <Box width={18}>
                <ProgressBar
                  value={workflow.successRate}
                  width={11}
                  showPercent={false}
                  color={scoreColor(workflow.successRate)}
                />
              </Box>
              <Box width={6}>
                <Text color={scoreColor(workflow.successRate)}>
                  {' '}
                  {workflow.successRate.toFixed(0).padStart(3)}%
                </Text>
              </Box>
              <Box width={6}>
                <Text color="gray">{String(workflow.totalRuns).padStart(4)}</Text>
              </Box>
              <Text color="gray">
                {' '}
                {duration(workflow.averageDurationSeconds)}
              </Text>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          RECENT FAILURES
        </Text>
        {ci.recentFailures.length === 0 ? (
          <Text color="green">No recent failures.</Text>
        ) : (
          ci.recentFailures.slice(0, 5).map((failure) => (
            <Box key={failure.runId}>
              <Box width={26}>
                <Text color="red">{truncate(failure.workflowName, 25)}</Text>
              </Box>
              <Box width={18}>
                <Text color="gray">
                  {failure.conclusion ?? 'failed'} on{' '}
                  {truncate(failure.branch ?? 'unknown', 8)}
                </Text>
              </Box>
              <Text color="gray">
                {failure.actor ? `${failure.actor}  ` : ''}
                {relativeTime(failure.completedAt)}
              </Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  )
}
