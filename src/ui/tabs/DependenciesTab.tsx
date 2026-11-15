import { Box, Text } from 'ink'
import type { RepositoryReport } from '../../insights/types.js'

type DependenciesTabProps = {
  report: RepositoryReport
}

const ECOSYSTEM_ORDER = ['npm', 'pypi', 'go', 'rubygems', 'packagist'] as const

export function DependenciesTab({ report }: DependenciesTabProps) {
  const { dependencies } = report
  const rows = ECOSYSTEM_ORDER.filter(
    (ecosystem) => (dependencies.ecosystems[ecosystem] ?? 0) > 0,
  )

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Dependencies
      </Text>
      <Text>
        Direct dependencies parsed: <Text bold>{dependencies.total}</Text>
      </Text>
      <Text color="gray">
        Registry and advisory lookups are skipped in CLI mode. Manifests only.
      </Text>

      <Box marginTop={1} flexDirection="column">
        {rows.length === 0 ? (
          <Text color="gray">No supported dependency manifests found.</Text>
        ) : (
          rows.map((ecosystem) => (
            <Text key={ecosystem}>
              {ecosystem.padEnd(14)}
              <Text bold>{dependencies.ecosystems[ecosystem]}</Text>
            </Text>
          ))
        )}
      </Box>

      {dependencies.partial ? (
        <Box marginTop={1}>
          <Text color="yellow">
            One or more manifests could not be parsed completely.
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}
