import { Text } from 'ink'
import { glyphs } from '../glyphs.js'
import type { Tone } from '../theme.js'

type SparklineProps = {
  values: number[]
  color?: Tone
}

export function Sparkline({ values, color = 'cyan' }: SparklineProps) {
  const max = Math.max(1, ...values)
  const chars = values.map((value) => {
    if (value <= 0) return glyphs.spark[0]!
    const index = Math.min(
      glyphs.spark.length - 1,
      Math.max(1, Math.round((value / max) * (glyphs.spark.length - 1))),
    )
    return glyphs.spark[index]!
  })
  return <Text color={color}>{chars.join('')}</Text>
}
