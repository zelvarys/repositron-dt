import type { ReactNode } from 'react'
import { Text } from 'ink'
import { colors, type Tone } from '../theme.js'
import { Card } from './Card.js'

type StatCardProps = {
  title: string
  value?: string
  detail?: string
  tone?: Tone
  children?: ReactNode
  flexGrow?: number
}

export function StatCard({
  title,
  value,
  detail,
  tone = colors.blue,
  children,
  flexGrow = 1,
}: StatCardProps) {
  return (
    <Card title={title} flexGrow={flexGrow}>
      {value ? (
        <Text bold color={tone} wrap="truncate-end">
          {value}
        </Text>
      ) : null}
      {detail ? (
        <Text color={colors.muted} wrap="truncate-end">
          {detail}
        </Text>
      ) : null}
      {children}
    </Card>
  )
}
