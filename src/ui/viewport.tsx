import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { Box, useWindowSize } from 'ink'
import { colors } from './theme.js'

export type Viewport = {
  columns: number
  rows: number
  wide: boolean
  medium: boolean
  tiny: boolean
}

const FALLBACK: Viewport = {
  columns: 100,
  rows: 30,
  wide: true,
  medium: true,
  tiny: false,
}

const ViewportContext = createContext<Viewport>(FALLBACK)

export function useViewport(): Viewport {
  return useContext(ViewportContext)
}

export function TerminalFrame({ children }: { children: ReactNode }) {
  const size = useWindowSize()
  const columns = Math.max(20, size.columns)
  const rows = Math.max(10, size.rows)

  const viewport = useMemo<Viewport>(
    () => ({
      columns,
      rows,
      wide: columns >= 100 && rows >= 28,
      medium: columns >= 80 && rows >= 28,
      tiny: columns < 80 || rows < 28,
    }),
    [columns, rows],
  )

  return (
    <ViewportContext.Provider value={viewport}>
      <Box
        width={columns}
        height={rows}
        flexDirection="column"
        overflow="hidden"
        backgroundColor={colors.background}
      >
        {children}
      </Box>
    </ViewportContext.Provider>
  )
}
