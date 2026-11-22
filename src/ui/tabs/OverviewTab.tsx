import { Box, Text } from 'ink'
import type {
  RepoHealthComponent,
  RepositoryReport,
} from '../../insights/types.js'
import { compactNumber, percent } from '../format.js'
import { colors, riskColor, scoreColor, type Tone } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Card } from '../components/Card.js'
import { ProgressBar } from '../components/ProgressBar.js'
import { Rule } from '../components/Rule.js'

type OverviewTabProps = {
  report: RepositoryReport
}

const SHORT_LABELS: Record<RepoHealthComponent['key'], string> = {
  activity: 'Activity',
  ci: 'Workflow',
  concentration: 'Spread',
  commitQuality: 'Quality',
  dependencies: 'Dependencies',
}

function healthLabel(score: number | null): string {
  if (score === null) return 'not enough data'
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'healthy'
  if (score >= 45) return 'needs attention'
  return 'at risk'
}

function componentColor(
  key: RepoHealthComponent['key'],
  score: number,
): Tone {
  if (score < 45) return colors.red
  if (key === 'concentration') return colors.yellow
  if (key === 'ci') return colors.green
  return colors.blue
}

function HealthCard({ report }: { report: RepositoryReport }) {
  const { columns, wide } = useViewport()
  const health = report.health.score
  const contentWidth = Math.max(40, columns - 2)
  const healthWidth = wide
    ? Math.floor((contentWidth - 1) * 0.66)
    : contentWidth
  const barWidth = Math.max(10, healthWidth - 4 - 18 - 10 - 5 - 2)

  return (
    <Card
      title="Repository health"
      borderColor={colors.active}
      flexGrow={wide ? 2 : undefined}
    >
      <Box
        flexDirection="row"
        marginTop={wide ? 1 : 0}
        columnGap={2}
      >
        <Box flexDirection="column" width={18}>
          <Text bold color={colors.text}>
            {health === null ? '--.-' : health.toFixed(1)}
            <Text color={colors.muted}> /100</Text>
          </Text>
          <Text color={scoreColor(health)}>{healthLabel(health)}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1} rowGap={wide ? 1 : 0}>
          {report.health.components.map((component) => (
            <Box key={component.key} height={1}>
              <Box width={10}>
                <Text color={colors.muted}>
                  {SHORT_LABELS[component.key]}
                </Text>
              </Box>
              <ProgressBar
                value={component.available ? component.score : 0}
                width={barWidth}
                showPercent={false}
                color={
                  component.available
                    ? componentColor(component.key, component.score)
                    : colors.muted
                }
              />
              <Box width={5} justifyContent="flex-end">
                <Text
                  color={
                    component.available ? colors.text : colors.muted
                  }
                >
                  {component.available
                    ? component.score.toFixed(0)
                    : 'n/a'}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  )
}

function CommitActivityCard({
  report,
  flexGrow = 1,
}: {
  report: RepositoryReport
  flexGrow?: number
}) {
  return (
    <Card title="Commit activity" flexGrow={flexGrow}>
      <Text bold color={colors.text} wrap="truncate-end">
        {report.activity.commitsLast30} commits / 30d
      </Text>
      <Text color={colors.muted} wrap="truncate-end">
        {report.contributorCount} contributors ·{' '}
        {percent(report.busFactor.top1Share)} top 1
      </Text>
    </Card>
  )
}

function ToolAdoptionCard({
  report,
  flexGrow = 1,
}: {
  report: RepositoryReport
  flexGrow?: number
}) {
  return (
    <Card title="Tool adoption" flexGrow={flexGrow}>
      <Text bold color={scoreColor(report.metrics.adoptionScore)} wrap="truncate-end">
        {report.metrics.toolsDetected}/{report.metrics.toolsChecked} detected
      </Text>
      <Text color={colors.muted} wrap="truncate-end">
        {report.metrics.toolsRelevant} relevant to this stack
      </Text>
    </Card>
  )
}

function CommitToolsCard({ report }: { report: RepositoryReport }) {
  const { columns, wide } = useViewport()
  const contentWidth = Math.max(40, columns - 2)
  const healthWidth = Math.floor((contentWidth - 1) * 0.66)
  const cardWidth = contentWidth - healthWidth - 1
  const ruleWidth = Math.max(8, cardWidth - 5)

  return (
    <Card flexGrow={1}>
      <Text bold color={colors.blueSoft}>
        COMMIT ACTIVITY
      </Text>
      <Text bold color={colors.text} wrap="truncate-end">
        {report.activity.commitsLast30} commits / 30d
      </Text>
      <Text color={colors.muted} wrap="truncate-end">
        {report.contributorCount} contributors ·{' '}
        {percent(report.busFactor.top1Share)} top 1
      </Text>
      <Box marginY={wide ? 1 : 0}>
        <Rule width={ruleWidth} />
      </Box>
      <Text bold color={colors.blueSoft}>
        TOOL ADOPTION
      </Text>
      <Text color={colors.muted} wrap="truncate-end">
        {report.metrics.toolsDetected}/{report.metrics.toolsChecked} detected ·{' '}
        {report.metrics.toolsRelevant} relevant
      </Text>
    </Card>
  )
}

function DependenciesCard({
  report,
  compact,
}: {
  report: RepositoryReport
  compact: boolean
}) {
  const deps = report.dependencies
  return (
    <Card title="Dependencies" flexGrow={1}>
      <Text bold color={colors.text} wrap="truncate-end">
        {compactNumber(deps.total)} direct
      </Text>
      <Text
        color={deps.outdated > 0 ? colors.yellow : colors.green}
        wrap="truncate-end"
      >
        {deps.outdated} outdated
        {compact ? ` · ${compactNumber(deps.checked)} ok` : ''}
      </Text>
      {!compact ? (
        <Text color={colors.muted} wrap="truncate-end">
          {compactNumber(deps.checked)} checked ·{' '}
          {deps.partial ? 'partial' : 'complete'}
        </Text>
      ) : null}
    </Card>
  )
}

function ConcentrationCard({
  report,
  compact,
}: {
  report: RepositoryReport
  compact: boolean
}) {
  const bus = report.busFactor
  return (
    <Card
      title={compact ? 'Concentration' : 'Contributor concentration'}
      flexGrow={1}
    >
      <Text bold color={colors.text} wrap="truncate-end">
        {percent(bus.top1Share)} top 1
      </Text>
      <Text color={colors.muted} wrap="truncate-end">
        Gini {bus.gini.toFixed(2)}
        {compact ? ` · top 3 ${percent(bus.top3Share, 0)}` : ''}
      </Text>
      {!compact ? (
        <Text color={riskColor(bus.risk)} wrap="truncate-end">
          {percent(bus.top3Share, 0)} top 3
        </Text>
      ) : null}
    </Card>
  )
}

function CiHealthCard({
  report,
  compact,
}: {
  report: RepositoryReport
  compact: boolean
}) {
  const ci = report.ci
  const success = ci?.successRate ?? null
  const detail = ci
    ? compact
      ? `${ci.workflows.length} flows · ${ci.recentFailures.length} failures`
      : `${ci.workflows.length} workflows tracked`
    : 'No workflows found'

  return (
    <Card title="CI health" flexGrow={1}>
      <Text
        bold
        color={success === null ? colors.muted : scoreColor(success)}
        wrap="truncate-end"
      >
        {success === null ? 'n/a' : `${percent(success)} success`}
      </Text>
      <Text color={colors.muted} wrap="truncate-end">
        {detail}
      </Text>
      {ci && !compact ? (
        <Text color={colors.muted} wrap="truncate-end">
          {ci.recentFailures.length} recent failures
        </Text>
      ) : null}
    </Card>
  )
}

export function OverviewTab({ report }: OverviewTabProps) {
  const { wide } = useViewport()
  const compact = !wide

  return (
    <Box flexDirection="column" overflow="hidden">
      <Box
        flexDirection={wide ? 'row' : 'column'}
        columnGap={1}
      >
        <HealthCard report={report} />
        {wide ? <CommitToolsCard report={report} /> : null}
      </Box>

      {!wide ? (
        <Box flexDirection="row" columnGap={1} marginTop={1}>
          <CommitActivityCard report={report} />
          <ToolAdoptionCard report={report} />
        </Box>
      ) : null}

      <Box flexDirection="row" columnGap={1} marginTop={1}>
        <DependenciesCard report={report} compact={compact} />
        <ConcentrationCard report={report} compact={compact} />
        <CiHealthCard report={report} compact={compact} />
      </Box>
    </Box>
  )
}
