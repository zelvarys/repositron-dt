import { Box, Text } from 'ink'
import { colors } from '../theme.js'

export type StatusTone = 'info' | 'success' | 'warning' | 'error' | 'muted'

const COLORS: Record<StatusTone, string> = {
  info: colors.blue,
  success: colors.green,
  warning: colors.yellow,
  error: colors.red,
  muted: colors.muted,
}

type StatusMessageProps = {
  tone?: StatusTone
  children: string
}

export function StatusMessage({ tone = 'info', children }: StatusMessageProps) {
  return (
    <Box>
      <Text color={COLORS[tone]}>{children}</Text>
    </Box>
  )
}
