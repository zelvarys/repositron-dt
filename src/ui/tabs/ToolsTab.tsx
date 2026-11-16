import { Box, Text } from 'ink'
import type { RepositoryReport, ToolCategory } from '../../insights/types.js'
import { toolsByCategory } from '../../insights/tools.js'
import { glyphs } from '../glyphs.js'
import { scoreColor } from '../theme.js'
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

export function ToolsTab({ report }: ToolsTabProps) {
  const tools = report.metrics.tools
  const detected = tools.filter((tool) => tool.detected).length
  const adoption = report.metrics.adoptionScore

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Box flexDirection="column">
          <Text bold color="cyan">
            TOOL ADOPTION
          </Text>
          <Text color="gray">
            {detected} of {tools.length} tools detected
          </Text>
        </Box>
        <Box flexDirection="column" alignItems="flex-end">
          <Text color="gray">weighted adoption</Text>
          <ProgressBar
            value={adoption}
            width={18}
            color={scoreColor(adoption)}
          />
        </Box>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {toolsByCategory(tools).map((group) => (
          <Box key={group.category} flexDirection="column" marginBottom={1}>
            <Text bold color="gray">
              {CATEGORY_LABELS[group.category]}
            </Text>
            {group.tools.map((tool) => {
              const active = tool.detected && tool.relevant
              return (
                <Box key={tool.name}>
                  <Text color={active ? 'green' : 'gray'}>{glyphs.dot} </Text>
                  <Box width={16}>
                    <Text color={active ? undefined : 'gray'}>{tool.name}</Text>
                  </Box>
                  {active ? (
                    <>
                      <ProgressBar
                        value={tool.adoptionRate}
                        width={18}
                        color={scoreColor(tool.adoptionRate)}
                      />
                      <Box width={10}>
                        <Text color="gray">
                          {' '}
                          {tool.contributorsUsing}/{tool.contributorCount}
                        </Text>
                      </Box>
                    </>
                  ) : (
                    <Text color="gray">
                      {tool.relevant ? 'not detected' : 'not applicable'}
                    </Text>
                  )}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>

      <Text color="gray">
        Adoption is a file-touch proxy from the latest 30 commit diffs; it does
        not prove a tool ran locally.
      </Text>
    </Box>
  )
}
