export function compactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}m`
  }
  if (value >= 10_000) return `${(value / 1_000).toFixed(0)}k`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function truncate(value: string, width: number): string {
  if (width <= 1) return value.slice(0, Math.max(0, width))
  if (value.length <= width) return value
  return `${value.slice(0, width - 1)}…`
}

export function relativeTime(value: string | null): string {
  if (!value) return 'unknown'
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return 'unknown'
  const delta = Date.now() - timestamp
  if (delta < 0) return 'just now'
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function dayLabel(date: string): string {
  return date.slice(5).replace('-', '/')
}
