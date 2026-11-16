import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { recentWeeks } from '../../insights/activity.js'
import { dayLabel, percent } from '../format.js'
import { glyphs } from '../glyphs.js'
import { riskColor, riskLabel } from '../theme.js'
import { Sparkline } from '../components/Sparkline.js'
import { StatCard } from '../components/StatCard.js'

type ActivityTabProps = {
  report: RepositoryReport
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ActivityTab({ report }: ActivityTabProps) {
  const activity = report.activity.ranges[90]
  const weeks = recentWeeks(
    activity.weekly,
    12,
    new Date(report.scannedAt),
  )
  const topContributors = activity.topContributors.slice(0, 5)
  const largestContributor = Math.max(
    1,
    ...topContributors.map((contributor) => contributor.commits),
  )

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
          <Text color="gray">last 12 weeks</Text>
        </Box>
        <Box>
          <Sparkline values={weeks.map((week) => week.count)} color="cyan" />
          <Text color="gray">
            {' '}
            {weeks.reduce((sum, week) => sum + week.count, 0)} commits
          </Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">{dayLabel(weeks[0]!.weekStart)}</Text>
          <Text color="gray">
            busiest {dayLabel(weeks.reduce((best, week) => (week.count > best.count ? week : best), weeks[0]!).weekStart)} with{' '}
            {Math.max(...weeks.map((week) => week.count))}
          </Text>
          <Text color="gray">{dayLabel(weeks[weeks.length - 1]!.weekStart)}</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color="cyan">
            TOP CONTRIBUTORS
          </Text>
          {topContributors.length === 0 ? (
            <Text color="gray">No commits in the last 90 days.</Text>
          ) : (
            topContributors.map((contributor) => (
              <Box key={contributor.login}>
                <Box width={20}>
                  <Text>{contributor.login.slice(0, 19)}</Text>
                </Box>
                <Box width={12}>
                  <Text color="gray">
                    {String(contributor.commits).padStart(4)} commits
                  </Text>
                </Box>
                <Text color="cyan">
                  {' '}
                  {glyphs.filled.repeat(
                    Math.max(1, Math.round((contributor.commits / largestContributor) * 8)),
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
          <Sparkline values={activity.weekday.slice(1).concat(activity.weekday[0]!)} color="magenta" />
          <Box justifyContent="space-between">
            {WEEKDAYS.map((day) => (
              <Text key={day} color="gray">
                {day[0]}
              </Text>
            ))}
          </Box>
          <Text color="gray">
            {activity.weekday.reduce((sum, value) => sum + value, 0)} commits
            across the 90 day window
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
