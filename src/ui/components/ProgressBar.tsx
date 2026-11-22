import { Text } from 'ink'
import { glyphs } from '../glyphs.js'
import { colors, scoreColor, type Tone } from '../theme.js'

type ProgressBarProps = {
  value: number
  width?: number
  showPercent?: boolean
  color?: Tone
}

export function ProgressBar({
  value,
  width = 20,
  showPercent = true,
  color,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const filled = Math.round((clamped / 100) * width)
  const tone = color ?? scoreColor(clamped)
  return (
    <Text>
      <Text color={tone}>{glyphs.filled.repeat(filled)}</Text>
      <Text color={colors.border}>{glyphs.empty.repeat(width - filled)}</Text>
      {showPercent ? (
        <Text color={colors.muted}> {clamped.toFixed(0).padStart(3)}%</Text>
      ) : null}
    </Text>
  )
}
