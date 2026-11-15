import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { ProgressBar, progressColor } from '../components/ProgressBar.js'

type CiTabProps = {
  report: RepositoryReport
}

function shortDate(value: string | null): string {
  if (!value) return 'unknown'
  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
    ? new Date(parsed).toISOString().slice(0, 16).replace('T', ' ')
    : 'unknown'
}

function duration(value: number | null): string {
  if (value === null) return 'n/a'
  if (value < 60) return `${value}s`
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}m ${seconds}s`
}

export function CiTab({ report }: CiTabProps) {
  const ci = report.ci
  if (!ci) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          CI health
        </Text>
        <Text color="gray">No GitHub Actions workflows found.</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        CI health
      </Text>
      {ci.successRate === null ? (
        <Text color="gray">No completed workflow runs found.</Text>
      ) : (
        <Box>
          <Text>Success rate: </Text>
          <ProgressBar
            value={ci.successRate}
            width={24}
            color={progressColor(ci.successRate)}
          />
          <Text color="gray"> {ci.totalRuns} completed runs</Text>
        </Box>
      )}
      {ci.partial ? (
        <Text color="yellow">
          Partial data: the workflow run history was truncated or unavailable.
        </Text>
      ) : null}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Workflows</Text>
        <Text color="gray">
          {'Workflow'.padEnd(30)}
          {'Runs'.padStart(6)}
          {'Success'.padStart(9)}
          {'Average'.padStart(10)}
        </Text>
        {ci.workflows.length === 0 ? (
          <Text color="gray">No completed workflow data.</Text>
        ) : (
          ci.workflows.map((workflow) => (
            <Text key={workflow.name}>
              {workflow.name.slice(0, 29).padEnd(30)}
              {String(workflow.totalRuns).padStart(6)}
              {`${workflow.successRate.toFixed(2)}%`.padStart(9)}
              {duration(workflow.averageDurationSeconds).padStart(10)}
            </Text>
          ))
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Recent failures</Text>
        {ci.recentFailures.length === 0 ? (
          <Text color="green">No recent failures.</Text>
        ) : (
          ci.recentFailures.slice(0, 5).map((failure) => (
            <Text key={failure.runId}>
              <Text color="red">{failure.workflowName.padEnd(24)}</Text>
              {`${failure.branch ?? 'unknown'} @ ${shortDate(failure.completedAt)}`}
            </Text>
          ))
        )}
      </Box>
    </Box>
  )
}
