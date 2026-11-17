import { Text } from 'ink'
import { glyphs } from '../glyphs.js'
import type { Tone } from '../theme.js'

type BadgeProps = {
  label: string
  tone?: Tone
  dot?: boolean
}

export function Badge({ label, tone = 'white', dot = true }: BadgeProps) {
  return (
    <Text color={tone}>
      {dot ? `${glyphs.dot} ` : ''}
      {label}
    </Text>
  )
}
