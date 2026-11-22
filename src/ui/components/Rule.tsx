import { Text } from 'ink'
import { glyphs } from '../glyphs.js'
import { colors } from '../theme.js'
import { useViewport } from '../viewport.js'

type RuleProps = {
  width?: number
  color?: string
}

export function Rule({ width, color = colors.border }: RuleProps) {
  const { columns } = useViewport()
  return (
    <Text color={color}>
      {glyphs.empty.repeat(Math.max(1, width ?? columns))}
    </Text>
  )
}
