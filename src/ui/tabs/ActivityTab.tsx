import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { recentWeeks } from '../../insights/activity.js'
import { dayLabel, percent } from '../format.js'
import { riskColor, riskLabel } from '../theme.js'
import { StatCard } from '../components/StatCard.js'

type ActivityTabProps = {
  report: RepositoryReport
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0]

export function ActivityTab({ report }: ActivityTabProps) {
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
  const weekdayCells = MONDAY_FIRST.map((day) =>
    `${WEEKDAYS[day]![0]}${String(activity.weekday[day] ?? 0).padStart(2)}`,
  ).join(' ')

  return (
    <Box flexDirection="column">
      <Box>
        <StatCard
          title="Last 30 days"
          value={`${report.activity.commitsLast30} commits`}
          detail={`${report.contributorCount} contributors`}
          tone="cyan"
        />
        <Box width={1} />
        <StatCard
          title="Top contributor"
          value={percent(report.busFactor.top1Share)}
          detail={`top 3 ${percent(report.busFactor.top3Share, 0)}`}
          tone={riskColor(report.busFactor.risk)}
        />
        <Box width={1} />
        <StatCard
          title="Concentration"
          value={`Gini ${report.busFactor.gini.toFixed(2)}`}
          detail={`${riskLabel(report.busFactor.risk)} risk`}
          tone={riskColor(report.busFactor.risk)}
        />
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box justifyContent="space-between">
          <Text bold color="cyan">
            WEEKLY RHYTHM
          </Text>
          <Text color="white">last 12 weeks</Text>
        </Box>
        <Text>
          <Text bold color="cyan">
            {totalWeekly}
          </Text>
          <Text color="white"> commits</Text>
          <Text color="white">{`  |  ${averageWeekly}/week  |  busiest `}</Text>
          <Text color="white">
            {dayLabel(busiest.weekStart)} ({busiest.count})
          </Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color="cyan">
            TOP CONTRIBUTORS
          </Text>
          {topContributors.length === 0 ? (
            <Text color="white">No commits in the last 90 days.</Text>
          ) : (
            topContributors.map((contributor) => (
              <Box key={contributor.login}>
                <Box width={18}>
                  <Text>{contributor.login.slice(0, 17)}</Text>
                </Box>
                <Box width={12}>
                  <Text color="white">
                    {String(contributor.commits).padStart(4)} commits
                  </Text>
                </Box>
                <Text color="cyan">
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
        </Box>
        <Box width={2} />
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color="cyan">
            WEEKDAY PULSE
          </Text>
          <Text color="cyan">{weekdayCells}</Text>
          <Text color="white">
            {weekdayTotal} commits across the 90 day window
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
