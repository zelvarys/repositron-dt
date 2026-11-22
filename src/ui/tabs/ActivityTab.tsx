import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { recentWeeks } from '../../insights/activity.js'
import { dayLabel, percent } from '../format.js'
import { colors, riskColor, riskLabel } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Card } from '../components/Card.js'
import { StatCard } from '../components/StatCard.js'

type ActivityTabProps = {
  report: RepositoryReport
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0]

export function ActivityTab({ report }: ActivityTabProps) {
  const { wide } = useViewport()
  const activity = report.activity.ranges[90]
  const weeks = recentWeeks(
    activity.weekly,
    12,
    new Date(report.scannedAt),
  )
  const topContributors = activity.topContributors.slice(0, 5)
  const totalWeekly = weeks.reduce((sum, week) => sum + week.count, 0)
  const averageWeekly = (totalWeekly / weeks.length).toFixed(1)
  const busiest = weeks.reduce(
    (best, week) => (week.count > best.count ? week : best),
    weeks[0]!,
  )
  const weekdayTotal = activity.weekday.reduce((sum, value) => sum + value, 0)
  const weekdayPairs = MONDAY_FIRST.map(
    (day) =>
      `${WEEKDAYS[day]} ${String(activity.weekday[day] ?? 0).padStart(2, '0')}`,
  )
  const weekdayLines = [
    weekdayPairs.slice(0, 4).join('  '),
    weekdayPairs.slice(4).join('  '),
  ]
  const contributorWidth = wide ? 20 : 16

  return (
    <Box flexDirection="column" flexGrow={1} overflow="hidden">
      <Box flexDirection="row" columnGap={1} flexGrow={4}>
        <StatCard
          title="Last 30 days"
          value={`${report.activity.commitsLast30} commits`}
          detail={`${report.contributorCount} contributors`}
        />
        <StatCard
          title="Top contributor"
          value={percent(report.busFactor.top1Share)}
          detail={`top 3 ${percent(report.busFactor.top3Share, 0)}`}
          tone={riskColor(report.busFactor.risk)}
        />
        <StatCard
          title="Concentration"
          value={`Gini ${report.busFactor.gini.toFixed(2)}`}
          detail={`${riskLabel(report.busFactor.risk)} risk`}
          tone={riskColor(report.busFactor.risk)}
        />
      </Box>

      <Box flexGrow={3} marginTop={1}>
        <Card title="Weekly rhythm" flexGrow={1}>
          <Box justifyContent="space-between">
            <Text>
              <Text bold color={colors.blue}>
                {totalWeekly}
              </Text>
              <Text color={colors.muted}> commits</Text>
              <Text color={colors.muted}>
                {`  |  ${averageWeekly}/week  |  busiest `}
              </Text>
              <Text color={colors.text}>
                {dayLabel(busiest.weekStart)} ({busiest.count})
              </Text>
            </Text>
            <Text color={colors.dim}>last 12 weeks</Text>
          </Box>
        </Card>
      </Box>

      <Box flexDirection="row" columnGap={1} flexGrow={6} marginTop={1}>
        <Card title="Top contributors" flexGrow={1}>
          {topContributors.length === 0 ? (
            <Text color={colors.muted}>
              No commits in the last 90 days.
            </Text>
          ) : (
            topContributors.map((contributor) => (
              <Box key={contributor.login} height={1}>
                <Box width={contributorWidth}>
                  <Text color={colors.text} wrap="truncate-end">
                    {contributor.login}
                  </Text>
                </Box>
                <Box width={12}>
                  <Text color={colors.muted}>
                    {String(contributor.commits).padStart(4)} commits
                  </Text>
                </Box>
                <Text color={colors.blue}>
                  {' '}
                  {percent(
                    weekdayTotal > 0
                      ? (contributor.commits / weekdayTotal) * 100
                      : 0,
                    0,
                  )}
                </Text>
              </Box>
            ))
          )}
        </Card>
        <Card title="Weekday pulse" flexGrow={1}>
          {weekdayLines.map((line) => (
            <Text key={line} color={colors.blue} wrap="truncate-end">
              {line}
            </Text>
          ))}
          <Text color={colors.muted} wrap="truncate-end">
            {weekdayTotal} commits across the 90 day window
          </Text>
        </Card>
      </Box>
    </Box>
  )
}
