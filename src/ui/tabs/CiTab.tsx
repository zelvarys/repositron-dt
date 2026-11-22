import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { percent, relativeTime, truncate } from '../format.js'
import { colors, scoreColor } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Badge } from '../components/Badge.js'
import { Card } from '../components/Card.js'
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
  const { columns, wide, rows } = useViewport()
  const ci = report.ci

  if (!ci) {
    return (
      <Box flexGrow={1}>
        <Card title="CI health">
          <Text color={colors.muted}>
            No GitHub Actions workflows found.
          </Text>
        </Card>
      </Box>
    )
  }

  const success = ci.successRate
  const limit = Math.max(3, rows - 18)
  const workflows = ci.workflows.slice(0, limit)
  const failures = ci.recentFailures.slice(
    0,
    Math.max(3, Math.floor(limit / 2)),
  )
  const hiddenWorkflows = ci.workflows.length - workflows.length
  const workflowWidth = wide
    ? Math.max(18, Math.floor(columns / 2) - 32)
    : Math.max(12, Math.floor(columns / 2) - 23)

  return (
    <Box flexDirection="column" flexGrow={1} overflow="hidden">
      <Box flexDirection="row" columnGap={1}>
        <StatCard
          title="Success rate"
          value={success === null ? 'n/a' : percent(success, 1)}
          detail={`${ci.totalRuns} completed runs`}
          tone={scoreColor(success)}
        />
        <StatCard
          title="Workflows"
          value={String(ci.workflows.length)}
          detail="tracked workflows"
        />
        <StatCard
          title="Recent failures"
          value={String(ci.recentFailures.length)}
          detail="in the last run window"
          tone={
            ci.recentFailures.length > 0 ? colors.red : colors.green
          }
        />
      </Box>

      <Box flexDirection="row" columnGap={1} marginTop={1}>
        <Card title="Workflows" flexGrow={1}>
          <Box height={1}>
            <Box width={workflowWidth}>
              <Text color={colors.dim}>Workflow</Text>
            </Box>
            <Text color={colors.dim}>{'Success'.padStart(9)}</Text>
            <Text color={colors.dim}>{'Runs'.padStart(7)}</Text>
            {wide ? (
              <Text color={colors.dim}>{'Average'.padStart(10)}</Text>
            ) : null}
          </Box>
          {workflows.length === 0 ? (
            <Text color={colors.muted}>No completed workflow data.</Text>
          ) : (
            workflows.map((workflow) => (
              <Box key={workflow.name} height={1}>
                <Box width={workflowWidth}>
                  <Text color={colors.text} wrap="truncate-end">
                    {truncate(workflow.name, workflowWidth - 1)}
                  </Text>
                </Box>
                <Box width={9}>
                  <Text color={scoreColor(workflow.successRate)}>
                    {`${workflow.successRate.toFixed(0)}%`.padStart(9)}
                  </Text>
                </Box>
                <Box width={7}>
                  <Text color={colors.muted}>
                    {String(workflow.totalRuns).padStart(7)}
                  </Text>
                </Box>
                {wide ? (
                  <Box width={10}>
                    <Text color={colors.muted}>
                      {duration(
                        workflow.averageDurationSeconds,
                      ).padStart(10)}
                    </Text>
                  </Box>
                ) : null}
              </Box>
            ))
          )}
          {hiddenWorkflows > 0 ? (
            <Text color={colors.dim}>
              +{hiddenWorkflows} more workflows
            </Text>
          ) : null}
        </Card>

        <Box flexGrow={1} alignSelf="flex-start">
          <Card title="Recent failures" flexGrow={1}>
            {ci.recentFailures.length === 0 ? (
              <Text color={colors.green}>No recent failures.</Text>
            ) : (
              failures.map((failure) => (
                <Box key={failure.runId} flexDirection="column">
                  <Text color={colors.red} wrap="truncate-end">
                    {truncate(failure.workflowName, 28)}
                  </Text>
                  <Text color={colors.muted} wrap="truncate-end">
                    {failure.conclusion ?? 'failed'} on{' '}
                    {truncate(failure.branch ?? 'unknown', 12)} ·{' '}
                    {relativeTime(failure.completedAt)}
                  </Text>
                </Box>
              ))
            )}
            {ci.partial ? (
              <Box marginTop={1}>
                <Badge
                  label="partial run history"
                  tone={colors.yellow}
                />
              </Box>
            ) : null}
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
