import { Box, Text } from 'ink'
import type {
  RepositoryReport,
  ToolCategory,
  ToolMetric,
} from '../../insights/types.js'
import { toolsByCategory } from '../../insights/tools.js'
import { truncate } from '../format.js'
import { glyphs } from '../glyphs.js'
import { colors, scoreColor } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Card } from '../components/Card.js'
import { ProgressBar } from '../components/ProgressBar.js'

type ToolsTabProps = {
  report: RepositoryReport
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  testing: 'Testing',
  linting: 'Linting and formatting',
  ci_cd: 'CI/CD',
  dependencies: 'Dependency automation',
  coverage: 'Coverage',
  docs: 'Documentation',
}

type ToolGroup = {
  category: ToolCategory
  tools: ToolMetric[]
}

function ToolRow({
  tool,
  nameWidth,
  showBar,
}: {
  tool: ToolMetric
  nameWidth: number
  showBar: boolean
}) {
  const active = tool.detected && tool.relevant
  return (
    <Box height={1}>
      <Text color={active ? colors.green : colors.dim}>
        {glyphs.dot}{' '}
      </Text>
      <Box width={nameWidth}>
        <Text color={active ? colors.text : colors.muted}>
          {truncate(tool.name, nameWidth - 1)}
        </Text>
      </Box>
      {showBar && active ? (
        <Box width={10} marginRight={1}>
          <ProgressBar
            value={tool.adoptionRate}
            width={8}
            showPercent={false}
            color={scoreColor(tool.adoptionRate)}
          />
        </Box>
      ) : null}
      <Text color={active ? colors.muted : colors.dim}>
        {active
          ? `${tool.contributorsUsing}/${tool.contributorCount}`
          : tool.relevant
            ? 'not detected'
            : 'not applicable'}
      </Text>
    </Box>
  )
}

function GroupColumn({
  groups,
  nameWidth,
  showBar,
}: {
  groups: ToolGroup[]
  nameWidth: number
  showBar: boolean
}) {
  return (
    <Box flexDirection="column" flexGrow={1} rowGap={1}>
      {groups.map((group) => (
        <Box key={group.category} flexDirection="column">
          <Text bold color={colors.blueSoft} wrap="truncate-end">
            {CATEGORY_LABELS[group.category]}
          </Text>
          {group.tools.map((tool) => (
            <ToolRow
              key={tool.name}
              tool={tool}
              nameWidth={nameWidth}
              showBar={showBar}
            />
          ))}
        </Box>
      ))}
    </Box>
  )
}

export function ToolsTab({ report }: ToolsTabProps) {
  const { columns, wide } = useViewport()
  const tools = report.metrics.tools
  const detected = tools.filter((tool) => tool.detected).length
  const adoption = report.metrics.adoptionScore
  const groups = toolsByCategory(tools)
  const left = groups.filter((_, index) => index % 2 === 0)
  const right = groups.filter((_, index) => index % 2 === 1)
  const showBar = wide && columns >= 110
  const nameWidth = Math.max(12, Math.floor(columns / 2) - 22)
  const summaryWidth = Math.max(12, Math.min(40, columns - 42))

  return (
    <Box flexDirection="column" overflow="hidden">
      <Card title="Tool adoption" borderColor={colors.active}>
        <Box justifyContent="space-between">
          <Text bold color={colors.text}>
            {detected} of {tools.length} tools detected
          </Text>
          <Text color={colors.muted} wrap="truncate-end">
            weighted adoption
          </Text>
        </Box>
        <ProgressBar
          value={adoption}
          width={summaryWidth}
          color={scoreColor(adoption)}
        />
      </Card>

      <Box flexDirection="row" columnGap={2} marginTop={1}>
        <GroupColumn
          groups={left}
          nameWidth={nameWidth}
          showBar={showBar}
        />
        <GroupColumn
          groups={right}
          nameWidth={nameWidth}
          showBar={showBar}
        />
      </Box>

      <Box marginTop={1}>
        <Text color={colors.dim} wrap="truncate-end">
          Adoption is a file-touch proxy from the latest 30 commit diffs.
        </Text>
      </Box>
    </Box>
  )
}
