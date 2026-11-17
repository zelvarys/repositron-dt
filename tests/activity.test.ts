import { describe, expect, it } from 'vitest'
import {
  buildCommitActivity,
  computeCommitQuality,
  isMergeCommit,
  recentWeeks,
  selectActivity,
} from '../src/insights/activity.js'
import { buildCommit } from './helpers/context.js'

const NOW = new Date('2026-10-29T12:00:00.000Z')

const commits = [
  buildCommit({
    sha: 'a1',
    authorLogin: 'alice',
    message: 'feat: add dashboard',
    date: '2026-10-29T12:00:00.000Z',
  }),
  buildCommit({
    sha: 'b2',
    authorLogin: 'bob',
    message: 'fix: correct total',
    date: '2026-10-28T10:00:00.000Z',
  }),
  buildCommit({
    sha: 'c3',
    authorLogin: 'alice',
    message: 'docs: document setup',
    date: '2026-10-20T10:00:00.000Z',
  }),
  buildCommit({
    sha: 'd4',
    authorLogin: 'carol',
    message: 'old commit',
    date: '2025-01-01T10:00:00.000Z',
  }),
]

describe('buildCommitActivity', () => {
  it('counts commits in range and buckets them by UTC week', () => {
    const activity = buildCommitActivity(commits, NOW)

    expect(activity.commitsLast30).toBe(3)
    expect(activity.ranges[365].daily).toEqual({
      '2026-10-20': 1,
      '2026-10-28': 1,
      '2026-10-29': 1,
    })
    expect(activity.ranges[365].weekly).toEqual([
      { weekStart: '2026-10-19', count: 1 },
      { weekStart: '2026-10-26', count: 2 },
    ])
    expect(activity.ranges[365].topContributors).toEqual([
      { login: 'alice', commits: 2 },
      { login: 'bob', commits: 1 },
    ])
  })

  it('computes commit quality only within 365 days', () => {
    const activity = buildCommitActivity(commits, NOW)

    expect(activity.quality.totalCommits).toBe(3)
    expect(activity.quality.conventionalPercent).toBe(100)
    expect(activity.quality.mostCommonType).toBe('docs')
  })

  it('selects a stored range for display', () => {
    const activity = buildCommitActivity(commits, NOW)
    const selected = selectActivity(activity, 90)
    expect(selected.range).toBe(90)
    expect(selected.quality.totalCommits).toBe(3)
    expect(selected.weekly).toHaveLength(2)
  })
})

describe('recentWeeks', () => {
  it('fills gaps and returns the requested window in chronological order', () => {
    const activity = buildCommitActivity(commits, NOW)
    const weeks = recentWeeks(activity.ranges[365].weekly, 4, NOW)

    expect(weeks).toEqual([
      { weekStart: '2026-10-05', count: 0 },
      { weekStart: '2026-10-12', count: 0 },
      { weekStart: '2026-10-19', count: 1 },
      { weekStart: '2026-10-26', count: 2 },
    ])
  })
})

describe('computeCommitQuality', () => {
  it('ignores merge commits and reports malformed messages', () => {
    expect(isMergeCommit('Merge pull request #12 from acme/feature')).toBe(true)
    const quality = computeCommitQuality([
      { message: 'feat: add thing\n\nbody text' },
      { message: 'fixed stuff' },
      { message: 'Merge branch main' },
      { message: 'fix: edge case' },
    ])

    expect(quality.totalCommits).toBe(3)
    expect(quality.conventionalPercent).toBe(66.67)
    expect(quality.bodyPercent).toBe(33.33)
    expect(quality.examples).toEqual(['fixed stuff'])
  })
})
