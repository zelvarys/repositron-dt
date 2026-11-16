import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import type { ScanResult } from '../../scan.js'
import { border } from '../theme.js'
import { Header } from '../components/Header.js'
import { OverviewTab } from '../tabs/OverviewTab.js'
import { ToolsTab } from '../tabs/ToolsTab.js'
import { ActivityTab } from '../tabs/ActivityTab.js'
import { DependenciesTab } from '../tabs/DependenciesTab.js'
import { CiTab } from '../tabs/CiTab.js'

type DashboardProps = {
  result: ScanResult
  username: string
  onBack: () => void
}

const TABS = [
  { key: '1', label: 'Overview' },
  { key: '2', label: 'Tools' },
  { key: '3', label: 'Activity' },
  { key: '4', label: 'Dependencies' },
  { key: '5', label: 'CI' },
] as const

type TabIndex = 0 | 1 | 2 | 3 | 4

export function Dashboard({ result, username, onBack }: DashboardProps) {
  const [active, setActive] = useState<TabIndex>(0)
  const tab = TABS[active]!

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onBack()
      return
    }
    if (input >= '1' && input <= '5') {
      setActive((Number(input) - 1) as TabIndex)
    }
  })

  return (
    <Box flexDirection="column">
      <Header
        repo={result.repo}
        languages={result.report.metrics.languages}
        username={username}
        tab={tab.label}
      />

      <Box marginTop={1} paddingX={1}>
        {TABS.map((item, index) => {
          const isActive = index === active
          return (
            <Box key={item.key} marginRight={1}>
              <Text
                color={isActive ? 'black' : 'white'}
                backgroundColor={isActive ? 'cyan' : undefined}
                bold={isActive}
              >
                {' '}
                {item.key} {item.label}{' '}
              </Text>
            </Box>
          )
        })}
      </Box>

      <Box
        borderStyle={border}
        borderColor={active === 3 ? 'magenta' : 'cyan'}
        flexDirection="column"
        marginTop={1}
        paddingX={2}
      >
        {active === 0 ? <OverviewTab report={result.report} /> : null}
        {active === 1 ? <ToolsTab report={result.report} /> : null}
        {active === 2 ? <ActivityTab report={result.report} /> : null}
        {active === 3 ? <DependenciesTab report={result.report} /> : null}
        {active === 4 ? <CiTab report={result.report} /> : null}
      </Box>

      <Box marginTop={1} paddingX={1} justifyContent="space-between">
        <Text color="white">1-5 switch view  |  q/Esc repos  |  Ctrl+C exit</Text>
        <Text color="white">{result.report.scannedAt.slice(0, 19).replace('T', ' ')}</Text>
      </Box>
    </Box>
  )
}
