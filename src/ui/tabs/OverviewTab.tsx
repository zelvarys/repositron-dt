import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { selectActivity } from '../../insights/activity.js'
import { ProgressBar, progressColor } from '../components/ProgressBar.js'
import { StatusMessage } from '../components/StatusMessage.js'

type OverviewTabProps = {
  report: RepositoryReport
}

function riskColor(
  risk: 'green' | 'yellow' | 'red',
): 'green' | 'yellow' | 'red' {
  return risk
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'unavailable'
  if (score >= 75) return 'healthy'
  if (score >= 50) return 'watch'
  return 'at risk'
}

export function OverviewTab({ report }: OverviewTabProps) {
  const activity = selectActivity(report.activity, 90)
  const commitsLast90 = Object.values(activity.daily).reduce(
    (sum, count) => sum + count,
    0,
  )
  const healthScore = report.health.score
  const busFactor = report.busFactor
  const adoption = report.metrics.adoptionScore
  const ciRate = report.ci?.successRate ?? null

  return (
    <Box flexDirection="column">
      <Box>
        <Box
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
          paddingX={1}
          width={34}
        >
          <Text bold color="cyan">
            Adoption score
          </Text>
          <Text>
            <Text bold>{adoption.toFixed(2)}</Text>
            <Text color="gray"> / 100</Text>
          </Text>
          <ProgressBar
            value={adoption}
            width={24}
            color={progressColor(adoption)}
          />
        </Box>
        <Box
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
          paddingX={1}
          width={34}
        >
          <Text bold color="cyan">
            Repository health
          </Text>
          <Text>
            <Text bold>{healthScore === null ? 'n/a' : healthScore.toFixed(1)}</Text>
            <Text color="gray"> / 100</Text>
          </Text>
          <ProgressBar
            value={healthScore ?? 0}
            width={24}
            color={progressColor(healthScore ?? 0)}
          />
          <Text color="gray">{scoreLabel(healthScore)}</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Box
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
          paddingX={1}
          width={34}
        >
          <Text bold color="cyan">
            Bus factor
          </Text>
          <Text color={riskColor(busFactor.risk)}>
            {busFactor.risk.toUpperCase()}
          </Text>
          <Text>
            Top 1: {busFactor.top1Share.toFixed(2)}% | Top 3:{' '}
            {busFactor.top3Share.toFixed(2)}%
          </Text>
          <Text color="gray">Gini: {busFactor.gini.toFixed(2)}</Text>
        </Box>
        <Box
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
          paddingX={1}
          width={34}
        >
          <Text bold color="cyan">
            Tools
          </Text>
          <Text>
            {report.metrics.toolsDetected}/{report.metrics.toolsChecked}{' '}
            detected
          </Text>
          <Text color="gray">
            {report.metrics.toolsRelevant} relevant to this repo
          </Text>
          <Text color="gray">
            {report.contributorCount} contributors | {commitsLast90} commits/90d
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <StatusMessage tone="muted">
          {`Bus factor: ${busFactor.risk} | Tools: ${report.metrics.toolsDetected}/${report.metrics.toolsChecked} detected`}
        </StatusMessage>
        <StatusMessage tone="muted">
          {`Activity: ${report.activity.commitsLast30} commits in the last 30 days`}
        </StatusMessage>
        <StatusMessage tone="muted">
          {`Dependencies: ${report.dependencies.total} parsed${
            report.dependencies.partial ? ' (partial)' : ''
          }`}
        </StatusMessage>
        <StatusMessage tone="muted">
          {ciRate === null
            ? 'CI: no workflow runs found'
            : `CI: ${ciRate.toFixed(2)}% success across ${report.ci?.totalRuns ?? 0} runs`}
        </StatusMessage>
      </Box>
    </Box>
  )
}
