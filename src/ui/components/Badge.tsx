import { Text } from 'ink'
import { glyphs } from '../glyphs.js'
import { colors, type Tone } from '../theme.js'

type BadgeProps = {
  label: string
  tone?: Tone
  dot?: boolean
}

export function Badge({ label, tone = colors.text, dot = true }: BadgeProps) {
  return (
    <Text color={tone}>
      {dot ? `${glyphs.dot} ` : ''}
      {label}
    </Text>
  )
}
