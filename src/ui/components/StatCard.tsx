import type { ReactNode } from 'react'
import { Box, Text } from 'ink'
import { border, type Tone } from '../theme.js'

type StatCardProps = {
  title: string
  value?: string
  detail?: string
  tone?: Tone
  children?: ReactNode
}

export function StatCard({
  title,
  value,
  detail,
  tone = 'cyan',
  children,
}: StatCardProps) {
  return (
    <Box
      borderStyle={border}
      borderColor="gray"
      flexDirection="column"
      flexGrow={1}
      flexBasis={0}
      paddingX={1}
    >
      <Text color="gray">{title.toUpperCase()}</Text>
      {value ? (
        <Text bold color={tone}>
          {value}
        </Text>
      ) : null}
      {detail ? <Text color="gray">{detail}</Text> : null}
      {children}
    </Box>
  )
}
