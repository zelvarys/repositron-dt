import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { recentWeeks } from '../../insights/activity.js'

type ActivityTabProps = {
  report: RepositoryReport
}

export function ActivityTab({ report }: ActivityTabProps) {
  const weeks = recentWeeks(report.activity.ranges[90].weekly, 12)
  const largest = Math.max(1, ...weeks.map((week) => week.count))
  const topContributors = report.activity.ranges[90].topContributors.slice(0, 5)
  const bus = report.busFactor

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Activity
      </Text>
      <Text>
        Commits last 30 days: <Text bold>{report.activity.commitsLast30}</Text>
        {'  |  '}
        Total contributors: <Text bold>{report.contributorCount}</Text>
      </Text>
      <Text color="gray">
        Bus factor risk: {bus.risk} | Top 3 share: {bus.top3Share.toFixed(2)}%
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Last 12 weeks</Text>
        {weeks.map((week) => {
          const width = Math.round((week.count / largest) * 30)
          return (
            <Text key={week.weekStart}>
              <Text color="gray">{week.weekStart}</Text>{' '}
              <Text color="green">{'#'.repeat(width).padEnd(30, '-')}</Text>{' '}
              {week.count}
            </Text>
          )
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Top contributors (90 days)</Text>
        {topContributors.length === 0 ? (
          <Text color="gray">No commits in this window.</Text>
        ) : (
          topContributors.map((contributor) => (
            <Text key={contributor.login}>
              {contributor.login.padEnd(28)} {contributor.commits} commits
            </Text>
          ))
        )}
      </Box>
    </Box>
  )
}
