import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import type { ScanResult } from '../../scan.js'
import { colors } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Header } from '../components/Header.js'
import { TabBar } from '../components/TabBar.js'
import { Footer } from '../components/Footer.js'
import { OverviewTab } from '../tabs/OverviewTab.js'
import { ToolsTab } from '../tabs/ToolsTab.js'
import { ActivityTab } from '../tabs/ActivityTab.js'
import { DependenciesTab } from '../tabs/DependenciesTab.js'
import { CiTab } from '../tabs/CiTab.js'

type DashboardProps = {
  result: ScanResult
  onBack: () => void
}

const TABS = [
  { key: '1', label: 'Overview' },
  { key: '2', label: 'Activity' },
  { key: '3', label: 'Dependencies' },
  { key: '4', label: 'Tools' },
  { key: '5', label: 'Workflows' },
] as const

const HINTS = [
  '1-5: tabs  ·  q/Esc: repos  ·  Ctrl+C exits',
  '1-5: tabs  ·  q/Esc: repos  ·  Ctrl+C exits',
  '1-5: tabs  ·  f: filter  ·  ←/→: page  ·  q: repos',
  '1-5: tabs  ·  q/Esc: repos  ·  Ctrl+C exits',
  '1-5: tabs  ·  q/Esc: repos  ·  Ctrl+C exits',
] as const

type TabIndex = 0 | 1 | 2 | 3 | 4

export function Dashboard({ result, onBack }: DashboardProps) {
  const [active, setActive] = useState<TabIndex>(0)
  const tab = TABS[active]!
  const { medium } = useViewport()
  const timestamp = result.report.scannedAt
    .slice(0, 19)
    .replace('T', ' ')

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
    <Box flexDirection="column" flexGrow={1}>
      <Header
        repo={result.repo}
        languages={result.report.metrics.languages}
        tab={tab.label}
      />

      {!medium ? (
        <Box
          flexDirection="column"
          flexGrow={1}
          alignItems="center"
          justifyContent="center"
          paddingX={2}
        >
          <Text bold color={colors.blueSoft}>
            TERMINAL TOO SMALL
          </Text>
          <Text color={colors.muted}>
            Resize to at least 80 columns and 28 rows.
          </Text>
        </Box>
      ) : (
        <>
          <TabBar tabs={TABS} active={active} />
          <Box
            flexDirection="column"
            flexGrow={1}
            paddingX={1}
            marginTop={1}
            overflow="hidden"
          >
            {active === 0 ? <OverviewTab report={result.report} /> : null}
            {active === 1 ? <ActivityTab report={result.report} /> : null}
            {active === 2 ? (
              <DependenciesTab report={result.report} />
            ) : null}
            {active === 3 ? <ToolsTab report={result.report} /> : null}
            {active === 4 ? <CiTab report={result.report} /> : null}
          </Box>
        </>
      )}

      <Footer hints={HINTS[active]} timestamp={timestamp} />
    </Box>
  )
}
