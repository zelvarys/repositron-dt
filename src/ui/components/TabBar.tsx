import { Box, Text } from 'ink'
import { colors } from '../theme.js'

type Tab = {
  key: string
  label: string
}

type TabBarProps = {
  tabs: readonly Tab[]
  active: number
}

export function TabBar({ tabs, active }: TabBarProps) {
  return (
    <Box paddingX={1} columnGap={2} flexShrink={0}>
      {tabs.map((tab, index) => {
        const isActive = index === active
        return (
          <Text
            key={tab.key}
            color={isActive ? colors.text : colors.muted}
            backgroundColor={isActive ? colors.active : undefined}
            bold={isActive}
          >
            {' '}
            {tab.key} {tab.label}{' '}
          </Text>
        )
      })}
    </Box>
  )
}
