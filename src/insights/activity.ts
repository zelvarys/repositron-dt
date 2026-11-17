import type {
  ActivityRange,
  CommitActivity,
  CommitQuality,
  ContributorActivity,
  StoredActivity,
} from './types.js'

export type ActivityCommit = {
  sha: string
  authorLogin: string | null
  message: string
  date: string
}

export type QualityCommit = {
  message: string
}

const RANGE_DAYS: ActivityRange[] = [90, 180, 365]
const DAY_MS = 24 * 60 * 60 * 1000
const CONVENTIONAL_RE =
  /^(feat|fix|docs|chore|refactor|test|style|perf)(\(.+\))?!?:/
const MERGE_RE = /^Merge (pull request|branch|remote-tracking branch|tag)\b/i

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function weekStart(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  const weekday = date.getUTCDay()
  const offset = weekday === 0 ? 6 : weekday - 1
  date.setUTCDate(date.getUTCDate() - offset)
  return isoDay(date)
}

function withinRange(date: string, now: Date, days: number): boolean {
  const parsed = Date.parse(date)
  if (!Number.isFinite(parsed)) return false
  const start = now.getTime() - (days - 1) * DAY_MS
  return parsed >= start && parsed <= now.getTime()
}

function sanitizeMessage(message: string): string {
  return message
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/@[A-Za-z0-9_-]+/g, '@user')
    .slice(0, 120)
}

export function isMergeCommit(message: string): boolean {
  return MERGE_RE.test(message.trim())
}

export function computeCommitQuality(commits: QualityCommit[]): CommitQuality {
  const relevant = commits.filter((commit) => {
    const firstLine = commit.message.split(/\r?\n/, 1)[0]?.trim() ?? ''
    return firstLine.length > 0 && !isMergeCommit(firstLine)
  })

  let conventional = 0
  let withBody = 0
  let firstLineLength = 0
  let bodyLength = 0
  const typeCounts = new Map<string, number>()
  const malformed: string[] = []
  const lengthBuckets = [0, 0, 0, 0, 0]

  for (const commit of relevant) {
    const lines = commit.message.split(/\r?\n/)
    const firstLine = lines[0]?.trim() ?? ''
    const body = lines.slice(1).join('\n').trim()
    firstLineLength += firstLine.length
    const bucket = Math.min(4, Math.floor(firstLine.length / 21))
    lengthBuckets[bucket]! += 1

    const match = CONVENTIONAL_RE.exec(firstLine)
    if (match) {
      conventional += 1
      const type = match[1]!
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)
    } else {
      malformed.push(sanitizeMessage(firstLine))
    }

    if (body.length > 0) {
      withBody += 1
      bodyLength += body.length
    }
  }

  const total = relevant.length
  const mostCommonType =
    [...typeCounts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? null

  const examples = [...new Set(malformed)]
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, 3)

  return {
    totalCommits: total,
    conventionalPercent:
      total === 0 ? 0 : round2((conventional / total) * 100),
    bodyPercent: total === 0 ? 0 : round2((withBody / total) * 100),
    averageMessageLength: total === 0 ? 0 : round2(firstLineLength / total),
    averageBodyLength: withBody === 0 ? 0 : round2(bodyLength / withBody),
    mostCommonType,
    examples,
    messageLengthBuckets: [
      { label: '0-20', count: lengthBuckets[0]! },
      { label: '21-40', count: lengthBuckets[1]! },
      { label: '41-60', count: lengthBuckets[2]! },
      { label: '61-80', count: lengthBuckets[3]! },
      { label: '81+', count: lengthBuckets[4]! },
    ],
  }
}

export function buildCommitActivity(
  commits: ActivityCommit[],
  now = new Date(),
): StoredActivity {
  const valid = commits.filter((commit) =>
    Number.isFinite(Date.parse(commit.date)),
  )
  const quality = computeCommitQuality(
    valid.filter((commit) => withinRange(commit.date, now, 365)),
  )
  const commitsLast30 = valid.filter((commit) =>
    withinRange(commit.date, now, 30),
  ).length

  const ranges = {} as StoredActivity['ranges']
  for (const range of RANGE_DAYS) {
    const inRange = valid.filter((commit) =>
      withinRange(commit.date, now, range),
    )
    const daily = new Map<string, number>()
    const authors = new Map<string, number>()
    const weekday = Array.from({ length: 7 }, () => 0)
    const hourOfDay = Array.from({ length: 24 }, () => 0)

    for (const commit of inRange) {
      const date = new Date(commit.date)
      const day = isoDay(date)
      daily.set(day, (daily.get(day) ?? 0) + 1)
      const login = commit.authorLogin ?? 'unknown'
      authors.set(login, (authors.get(login) ?? 0) + 1)
      weekday[date.getUTCDay()]! += 1
      hourOfDay[date.getUTCHours()]! += 1
    }

    const weekly = new Map<string, number>()
    for (const [day, count] of daily) {
      const start = weekStart(day)
      weekly.set(start, (weekly.get(start) ?? 0) + count)
    }

    const topContributors: ContributorActivity[] = [...authors.entries()]
      .map(([login, count]) => ({ login, commits: count }))
      .sort((a, b) => b.commits - a.commits || a.login.localeCompare(b.login))
      .slice(0, 20)

    ranges[range] = {
      daily: Object.fromEntries([...daily.entries()].sort()),
      weekly: [...weekly.entries()]
        .sort()
        .map(([weekStartDate, count]) => ({
          weekStart: weekStartDate,
          count,
        })),
      topContributors,
      weekday,
      hourOfDay,
    }
  }

  return { quality, commitsLast30, ranges }
}

export function selectActivity(
  stored: StoredActivity,
  range: ActivityRange,
): CommitActivity {
  return {
    range,
    quality: stored.quality,
    ...stored.ranges[range],
  }
}

export function recentWeeks(
  weekly: Array<{ weekStart: string; count: number }>,
  count: number,
  now = new Date(),
): Array<{ weekStart: string; count: number }> {
  const byWeek = new Map(weekly.map((week) => [week.weekStart, week.count]))
  const currentWeek = weekStart(isoDay(now))
  const current = new Date(`${currentWeek}T00:00:00.000Z`)
  const result: Array<{ weekStart: string; count: number }> = []

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(current)
    date.setUTCDate(date.getUTCDate() - index * 7)
    const start = isoDay(date)
    result.push({ weekStart: start, count: byWeek.get(start) ?? 0 })
  }

  return result
}
