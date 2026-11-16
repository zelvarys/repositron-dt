import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'
import { compactNumber, percent } from '../format.js'
import { riskColor, scoreColor } from '../theme.js'
import { ProgressBar } from '../components/ProgressBar.js'
import { StatCard } from '../components/StatCard.js'

type OverviewTabProps = {
  report: RepositoryReport
}

function healthLabel(score: number | null): string {
  if (score === null) return 'not enough data'
  if (score >= 80) return 'excellent'
  if (score >= 65) return 'healthy'
  if (score >= 45) return 'needs attention'
  return 'at risk'
}

export function OverviewTab({ report }: OverviewTabProps) {
  const health = report.health.score
  const adoption = report.metrics.adoptionScore
  const deps = report.dependencies
  const bus = report.busFactor

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Box flexDirection="column" width={24}>
          <Text color="white">REPOSITORY HEALTH</Text>
          <Text bold color={scoreColor(health)}>
            {health === null ? '--.-' : health.toFixed(1)}
            <Text color="white"> / 100</Text>
          </Text>
          <Text color="white">{healthLabel(health)}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1} paddingLeft={2}>
          {report.health.components.map((component) => (
            <Box key={component.key}>
              <Box width={20}>
                <Text color={component.available ? undefined : 'white'}>
                  {component.label}
                </Text>
              </Box>
              <ProgressBar
                value={component.available ? component.score : 0}
                width={18}
                showPercent={false}
                color={component.available ? scoreColor(component.score) : 'white'}
              />
              <Text color={component.available ? scoreColor(component.score) : 'white'}>
                {' '}
                {component.available ? component.score.toFixed(1) : 'n/a'}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      <Box marginTop={1}>
        <StatCard
          title="Commit activity"
          value={`${report.activity.commitsLast30} commits / 30d`}
          detail={`${report.contributorCount} contributors  |  ${percent(bus.top1Share)} top 1`}
          tone="cyan"
        />
        <Box width={1} />
        <StatCard
          title="Tool adoption"
          value={`${report.metrics.toolsDetected}/${report.metrics.toolsChecked} detected`}
          detail={`${report.metrics.toolsRelevant} relevant to this stack`}
          tone={scoreColor(adoption)}
        />
      </Box>

      <Box marginTop={1}>
        <StatCard
          title="Dependencies"
          value={`${compactNumber(deps.total)} direct`}
          detail={`${deps.outdated} outdated  |  ${deps.advisoryCount} advisories`}
          tone={deps.advisoryCount > 0 ? 'red' : deps.outdated > 0 ? 'yellow' : 'green'}
        />
        <Box width={1} />
        <StatCard
          title="Contributor concentration"
          value={`${percent(bus.top1Share)} top 1`}
          detail={`Gini ${bus.gini.toFixed(2)}  |  top 3 ${percent(bus.top3Share, 0)}`}
          tone={riskColor(bus.risk)}
        />
      </Box>
    </Box>
  )
}
