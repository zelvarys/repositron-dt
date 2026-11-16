import { Box, Text } from 'ink'

export type StatusTone = 'info' | 'success' | 'warning' | 'error' | 'muted'

const COLORS: Record<StatusTone, 'cyan' | 'green' | 'yellow' | 'red' | 'white'> =
  {
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    muted: 'white',
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
