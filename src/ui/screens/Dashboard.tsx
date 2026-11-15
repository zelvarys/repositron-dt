import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import type { ScanResult } from '../../scan.js'
import { Header } from '../components/Header.js'
import { OverviewTab } from '../tabs/OverviewTab.js'
import { ToolsTab } from '../tabs/ToolsTab.js'
import { ActivityTab } from '../tabs/ActivityTab.js'
import { DependenciesTab } from '../tabs/DependenciesTab.js'
import { CiTab } from '../tabs/CiTab.js'

type DashboardProps = {
  result: ScanResult
  username?: string
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
      />
      <Box
        borderStyle="single"
        borderColor="gray"
        flexDirection="column"
        paddingX={1}
        paddingY={1}
      >
        <Box>
          {TABS.map((tab, index) => {
            const isActive = index === active
            return (
              <Box key={tab.key} marginRight={2}>
                <Text color={isActive ? 'cyan' : 'gray'} bold={isActive}>
                  [{tab.key}] {tab.label}
                </Text>
              </Box>
            )
          })}
        </Box>

        <Box marginTop={1} flexDirection="column">
          {active === 0 ? <OverviewTab report={result.report} /> : null}
          {active === 1 ? <ToolsTab tools={result.report.metrics.tools} /> : null}
          {active === 2 ? <ActivityTab report={result.report} /> : null}
          {active === 3 ? (
            <DependenciesTab report={result.report} />
          ) : null}
          {active === 4 ? <CiTab report={result.report} /> : null}
        </Box>

        <Box marginTop={1}>
          <Text color="gray">
            Press 1-5 to switch tabs. q or Esc returns to the repository picker.
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
