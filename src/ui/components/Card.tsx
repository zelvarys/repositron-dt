import type { ReactNode } from 'react'
import { Box, Text } from 'ink'
import { border, colors } from '../theme.js'

type CardProps = {
  title?: string
  children: ReactNode
  flexGrow?: number
  borderColor?: string
  titleColor?: string
  paddingX?: number
}

export function Card({
  title,
  children,
  flexGrow,
  borderColor = colors.borderStrong,
  titleColor = colors.blueSoft,
  paddingX = 1,
}: CardProps) {
  return (
    <Box
      borderStyle={border}
      borderColor={borderColor}
      flexDirection="column"
      flexGrow={flexGrow}
      flexBasis={flexGrow === undefined ? undefined : 0}
      alignSelf="stretch"
      paddingX={paddingX}
      overflow="hidden"
      backgroundColor={colors.panel}
    >
      {title ? (
        <Text bold color={titleColor} wrap="truncate-end">
          {title.toUpperCase()}
        </Text>
      ) : null}
      {children}
    </Box>
  )
}
