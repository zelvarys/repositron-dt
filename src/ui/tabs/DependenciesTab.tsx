import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { ANY_VERSION } from '../../insights/dependencies.js'
import type {
  CheckedDependency,
  RepositoryReport,
} from '../../insights/types.js'
import { relativeTime, truncate } from '../format.js'
import { glyphs } from '../glyphs.js'
import type { Tone } from '../theme.js'
import { Badge } from '../components/Badge.js'

type DependenciesTabProps = {
  report: RepositoryReport
}

type Mode = 'all' | 'outdated'

const MODES: Array<{ key: Mode; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'outdated', label: 'Outdated' },
]

const PAGE_SIZE = 8

function statusOf(row: CheckedDependency): {
  label: string
  tone: Tone
} {
  if (row.outdated) return { label: 'OUTDATED', tone: 'yellow' }
  if (row.latestVersion) return { label: 'current', tone: 'green' }
  return { label: 'unverified', tone: 'white' }
}

export function DependenciesTab({ report }: DependenciesTabProps) {
  const { dependencies } = report
  const [mode, setMode] = useState<Mode>('all')
  const [page, setPage] = useState(0)
  const current = Math.max(0, dependencies.checked - dependencies.outdated)
  const unverified = Math.max(0, dependencies.total - dependencies.checked)

  const filtered = dependencies.rows.filter((row) => {
    if (mode === 'outdated') return row.outdated
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const visible = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  )

  const cycleMode = () => {
    const index = MODES.findIndex((item) => item.key === mode)
    setMode(MODES[(index + 1) % MODES.length]!.key)
    setPage(0)
  }

  useInput((input, key) => {
    if (input === 'f') {
      cycleMode()
      return
    }
    if (key.leftArrow) setPage(Math.max(0, safePage - 1))
    if (key.rightArrow) setPage(Math.min(totalPages - 1, safePage + 1))
  })

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Box flexDirection="column">
          <Text bold color="cyan">
            DEPENDENCY INTELLIGENCE
          </Text>
          <Text color="white">
            {Object.entries(dependencies.ecosystems)
              .map(([name, count]) => `${name} ${count}`)
              .join('  ') || 'no manifests'}
          </Text>
        </Box>
        <Text color="white">
          checked {dependencies.checked}/{dependencies.total}{' '}
          {relativeTime(dependencies.checkedAt)}
        </Text>
      </Box>

      <Box marginTop={1} justifyContent="space-between">
        <Box flexDirection="column">
          <Text color="white">DIRECT</Text>
          <Text bold>{dependencies.total}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color="white">OUTDATED</Text>
          <Text bold color={dependencies.outdated > 0 ? 'yellow' : 'green'}>
            {dependencies.outdated}
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="white">CURRENT</Text>
          <Text bold color="green">
            {current}
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="white">UNVERIFIED</Text>
          <Text bold color={unverified > 0 ? 'white' : 'green'}>
            {unverified}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        {MODES.map((item) => {
          const active = item.key === mode
          return (
            <Box key={item.key} marginRight={1}>
              <Text
                color={active ? 'black' : 'white'}
                backgroundColor={active ? 'cyan' : undefined}
                bold={active}
              >
                {' '}
                {item.label}{' '}
              </Text>
            </Box>
          )
        })}
        <Text color="white">  f cycles  |  left/right pages</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="white">
          {'Dependency'.padEnd(27)}
          {'Ecosystem'.padEnd(10)}
          {'Current'.padEnd(13)}
          {'Latest'.padEnd(13)}
          {'Status'}
        </Text>
        {visible.length === 0 ? (
          <Text color="white">No dependencies in this view.</Text>
        ) : (
          visible.map((row) => {
            const status = statusOf(row)
            return (
              <Box key={`${row.ecosystem}:${row.name}`}>
                <Box width={27}>
                  <Text>{truncate(row.name, 26)}</Text>
                </Box>
                <Box width={10}>
                  <Text color="white">{row.ecosystem}</Text>
                </Box>
                <Box width={13}>
                  <Text color="white">
                    {row.version === ANY_VERSION
                      ? 'any'
                      : truncate(row.version, 12)}
                  </Text>
                </Box>
                <Box width={13}>
                  <Text color="white">
                    {row.latestVersion
                      ? truncate(row.latestVersion, 12)
                      : 'unknown'}
                  </Text>
                </Box>
                <Text color={status.tone}>{status.label}</Text>
              </Box>
            )
          })
        )}
      </Box>

      <Box marginTop={1} justifyContent="space-between">
        <Text color="white">
          {filtered.length} row{filtered.length === 1 ? '' : 's'}  |  page{' '}
          {safePage + 1}/{totalPages}
        </Text>
        {dependencies.partial ? (
          <Badge label="partial registry data" tone="yellow" />
        ) : (
          <Text color="green">{glyphs.dot} registry lookups complete</Text>
        )}
      </Box>
    </Box>
  )
}
