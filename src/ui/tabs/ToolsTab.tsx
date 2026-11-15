import { Box, Text } from 'ink'
import type { ToolMetric } from '../../insights/types.js'
import { ProgressBar, progressColor } from '../components/ProgressBar.js'

type ToolsTabProps = {
  tools: ToolMetric[]
}

function status(tool: ToolMetric): {
  label: string
  color: 'green' | 'gray'
} {
  if (!tool.relevant) return { label: '[--]', color: 'gray' }
  if (tool.detected) return { label: '[OK]', color: 'green' }
  return { label: '[--]', color: 'gray' }
}

export function ToolsTab({ tools }: ToolsTabProps) {
  const detected = tools.filter((tool) => tool.detected).length

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Tool adoption ({detected}/{tools.length} detected)
      </Text>
      <Text color="gray">
        Adoption is a file-touch proxy, not proof of local execution.
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">
          {'Tool'.padEnd(18)}
          {'Category'.padEnd(14)}
          {'Status'.padEnd(8)}
          {'Adoption'}
        </Text>
        {tools.map((tool) => {
          const state = status(tool)
          return (
            <Box key={tool.name}>
              <Text color={tool.relevant ? undefined : 'gray'}>
                {tool.name.padEnd(18)}
              </Text>
              <Text color="gray">{tool.category.padEnd(14)}</Text>
              <Text color={state.color}>{state.label.padEnd(8)}</Text>
              {tool.detected && tool.relevant ? (
                <ProgressBar
                  value={tool.adoptionRate}
                  width={14}
                  color={progressColor(tool.adoptionRate)}
                />
              ) : (
                <Text color="gray">
                  {tool.relevant ? 'not detected' : 'not applicable'}
                </Text>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
