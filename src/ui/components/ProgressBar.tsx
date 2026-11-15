import { Text } from 'ink'

type ProgressBarProps = {
  value: number
  width?: number
  showPercent?: boolean
  color?: 'green' | 'yellow' | 'red' | 'cyan' | 'gray'
}

export function ProgressBar({
  value,
  width = 20,
  showPercent = true,
  color = 'cyan',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const filled = Math.round((clamped / 100) * width)
  const bar = `${'#'.repeat(filled)}${'-'.repeat(width - filled)}`
  return (
    <Text>
      <Text color={color}>[</Text>
      <Text color={color}>{bar}</Text>
      <Text color={color}>]</Text>
      {showPercent ? <Text> {clamped.toFixed(0)}%</Text> : null}
    </Text>
  )
}

export function progressColor(
  value: number,
): 'green' | 'yellow' | 'red' {
  if (value >= 75) return 'green'
  if (value >= 40) return 'yellow'
  return 'red'
}
