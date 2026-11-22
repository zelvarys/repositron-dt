import { Box, Text } from 'ink'
import { truncate } from '../format.js'
import { colors } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Rule } from './Rule.js'

type FooterProps = {
  hints: string
  timestamp?: string
}

export function Footer({ hints, timestamp }: FooterProps) {
  const { columns } = useViewport()
  const stamp = timestamp ?? ''
  const showStamp = stamp.length > 0 && columns >= stamp.length + 12
  const hintWidth = Math.max(
    6,
    columns - (showStamp ? stamp.length + 2 : 0) - 2,
  )

  return (
    <Box flexDirection="column" flexShrink={0}>
      <Rule />
      <Box paddingX={1} justifyContent="space-between">
        <Text color={colors.muted} wrap="truncate-end">
          {truncate(hints, hintWidth)}
        </Text>
        {showStamp ? <Text color={colors.dim}> {stamp}</Text> : null}
      </Box>
    </Box>
  )
}
