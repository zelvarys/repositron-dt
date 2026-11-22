export type Tone = string

export const colors = {
  background: '#09090b',
  panel: '#0d0f14',
  border: '#27272a',
  borderStrong: '#3f3f46',
  active: '#1d4ed8',
  blue: '#60a5fa',
  blueSoft: '#93c5fd',
  green: '#4ade80',
  yellow: '#facc15',
  red: '#f87171',
  text: '#f5f5f4',
  muted: '#a1a1aa',
  dim: '#71717a',
} as const

export const border = 'round' as const

export function scoreColor(value: number | null): Tone {
  if (value === null) return colors.muted
  if (value >= 75) return colors.green
  if (value >= 45) return colors.yellow
  return colors.red
}

export function riskColor(
  risk: 'green' | 'yellow' | 'red',
): 'green' | 'yellow' | 'red' {
  return risk
}

export function riskLabel(risk: 'green' | 'yellow' | 'red'): string {
  if (risk === 'green') return 'LOW'
  if (risk === 'yellow') return 'MODERATE'
  return 'HIGH'
}
