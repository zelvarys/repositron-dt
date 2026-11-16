export type Tone = 'green' | 'yellow' | 'red' | 'cyan' | 'white' | 'magenta' | 'gray'

export const border = 'round' as const

export function scoreColor(value: number | null): Tone {
  if (value === null) return 'white'
  if (value >= 75) return 'green'
  if (value >= 45) return 'yellow'
  return 'red'
}

export function severityColor(
  severity: 'low' | 'moderate' | 'high' | 'critical' | null,
): Tone {
  if (severity === 'critical' || severity === 'high') return 'red'
  if (severity === 'moderate') return 'yellow'
  if (severity === 'low') return 'cyan'
  return 'white'
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
