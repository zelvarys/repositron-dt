import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { ANY_VERSION } from '../../insights/dependencies.js'
import type {
  CheckedDependency,
  RepositoryReport,
} from '../../insights/types.js'
import { relativeTime, truncate } from '../format.js'
import { glyphs } from '../glyphs.js'
import { colors, type Tone } from '../theme.js'
import { useViewport } from '../viewport.js'
import { Badge } from '../components/Badge.js'
import { Card } from '../components/Card.js'
import { StatCard } from '../components/StatCard.js'

type DependenciesTabProps = {
  report: RepositoryReport
}

type Mode = 'all' | 'outdated'

const MODES: Array<{ key: Mode; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'outdated', label: 'Outdated' },
]

function statusOf(row: CheckedDependency): {
  label: string
  tone: Tone
} {
  if (row.outdated) return { label: 'outdated', tone: colors.yellow }
  if (row.latestVersion) return { label: 'current', tone: colors.green }
  return { label: 'unverified', tone: colors.muted }
}

export function DependenciesTab({ report }: DependenciesTabProps) {
  const { dependencies } = report
  const { columns, rows } = useViewport()
  const [mode, setMode] = useState<Mode>('all')
  const [page, setPage] = useState(0)
  const current = Math.max(0, dependencies.checked - dependencies.outdated)
  const unverified = Math.max(0, dependencies.total - dependencies.checked)
  const tableWidth = Math.max(50, columns - 6)
  const nameWidth = Math.max(14, tableWidth - 40)
  const pageSize = Math.max(3, rows - 19)

  const filtered = dependencies.rows.filter((row) => {
    if (mode === 'outdated') return row.outdated
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const visible = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
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
    <Box flexDirection="column" flexGrow={1} overflow="hidden">
      <Box flexDirection="row" columnGap={1} flexShrink={0}>
        <StatCard
          title="Direct"
          value={String(dependencies.total)}
          detail="declared"
        />
        <StatCard
          title="Outdated"
          value={String(dependencies.outdated)}
          tone={dependencies.outdated > 0 ? colors.yellow : colors.green}
          detail="needs update"
        />
        <StatCard
          title="Current"
          value={String(current)}
          tone={colors.green}
          detail="up to date"
        />
        <StatCard
          title="Unverified"
          value={String(unverified)}
          tone={unverified > 0 ? colors.muted : colors.green}
          detail="not checked"
        />
      </Box>

      <Box marginTop={1} justifyContent="space-between" flexShrink={0}>
        <Box columnGap={1}>
          {MODES.map((item) => {
            const active = item.key === mode
            return (
              <Text
                key={item.key}
                color={active ? colors.text : colors.muted}
                backgroundColor={active ? colors.active : undefined}
                bold={active}
              >
                {' '}
                {item.label}{' '}
              </Text>
            )
          })}
        </Box>
        <Text color={colors.dim}>
          {Object.entries(dependencies.ecosystems)
            .map(([name, count]) => `${name} ${count}`)
            .join('  ') || 'no manifests'}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Card>
          <Box height={1}>
            <Box width={nameWidth}>
              <Text color={colors.dim}>Dependency</Text>
            </Box>
            <Box width={8}>
              <Text color={colors.dim}>Type</Text>
            </Box>
            <Box width={11}>
              <Text color={colors.dim}>Current</Text>
            </Box>
            <Box width={11}>
              <Text color={colors.dim}>Latest</Text>
            </Box>
            <Box width={10}>
              <Text color={colors.dim}>Status</Text>
            </Box>
          </Box>
          {visible.length === 0 ? (
            <Text color={colors.muted}>
              No dependencies in this view.
            </Text>
          ) : (
            visible.map((row) => {
              const status = statusOf(row)
              return (
                <Box key={`${row.ecosystem}:${row.name}`} height={1}>
                  <Box width={nameWidth}>
                    <Text color={colors.text} wrap="truncate-end">
                      {truncate(row.name, nameWidth - 1)}
                    </Text>
                  </Box>
                  <Box width={8}>
                    <Text color={colors.muted}>{row.ecosystem}</Text>
                  </Box>
                  <Box width={11}>
                    <Text color={colors.muted} wrap="truncate-end">
                      {row.version === ANY_VERSION
                        ? 'any'
                        : truncate(row.version, 10)}
                    </Text>
                  </Box>
                  <Box width={11}>
                    <Text color={colors.muted} wrap="truncate-end">
                      {row.latestVersion
                        ? truncate(row.latestVersion, 10)
                        : 'unknown'}
                    </Text>
                  </Box>
                  <Box width={10}>
                    <Text color={status.tone} wrap="truncate-end">
                      {status.label}
                    </Text>
                  </Box>
                </Box>
              )
            })
          )}
        </Card>
      </Box>

      <Box justifyContent="space-between" flexShrink={0}>
        <Text color={colors.dim}>
          {filtered.length} row{filtered.length === 1 ? '' : 's'}  |  page{' '}
          {safePage + 1}/{totalPages}  |  checked{' '}
          {relativeTime(dependencies.checkedAt)}
        </Text>
        {dependencies.partial ? (
          <Badge label="partial registry data" tone={colors.yellow} />
        ) : (
          <Text color={colors.green}>
            {glyphs.dot} registry lookups complete
          </Text>
        )}
      </Box>
    </Box>
  )
}
