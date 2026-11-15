import { describe, expect, it } from 'vitest'
import {
  computeBusFactor,
  computeGini,
  concentrationRisk,
} from '../src/insights/bus-factor.js'

function commits(author: string, count: number) {
  return Array.from({ length: count }, () => ({ authorLogin: author }))
}

describe('computeGini', () => {
  it('returns 0 for no activity or perfect equality', () => {
    expect(computeGini([])).toBe(0)
    expect(computeGini([3, 3, 3])).toBe(0)
  })

  it('returns 1 for a single contributor', () => {
    expect(computeGini([15])).toBe(1)
  })

  it('increases as commit ownership concentrates', () => {
    const balanced = computeGini([5, 5, 5, 5])
    const concentrated = computeGini([16, 2, 1, 1])
    expect(concentrated).toBeGreaterThan(balanced)
  })
})

describe('computeBusFactor', () => {
  it('calculates shares and risk for an imbalanced history', () => {
    const result = computeBusFactor([
      ...commits('alice', 8),
      ...commits('bob', 1),
      ...commits('carol', 1),
    ])

    expect(result.totalCommits).toBe(10)
    expect(result.contributorCount).toBe(3)
    expect(result.top1Share).toBe(80)
    expect(result.top3Share).toBe(100)
    expect(result.gini).toBe(0.47)
    expect(result.risk).toBe('red')
    expect(result.topContributors[0]).toMatchObject({
      login: 'alice',
      commits: 8,
      share: 80,
    })
  })

  it('reports a low risk for balanced ownership', () => {
    const result = computeBusFactor([
      ...commits('alice', 3),
      ...commits('bob', 3),
      ...commits('carol', 3),
    ])

    expect(result.top1Share).toBe(33.33)
    expect(result.risk).toBe('green')
    expect(result.gini).toBe(0)
  })

  it('attributes commits without a login to unknown', () => {
    const result = computeBusFactor([
      { authorLogin: null },
      { authorLogin: 'alice' },
    ])

    expect(result.contributorCount).toBe(2)
    expect(result.topContributors.map((row) => row.login)).toEqual([
      'alice',
      'unknown',
    ])
  })

  it('handles an empty history', () => {
    const result = computeBusFactor([])
    expect(result.totalCommits).toBe(0)
    expect(result.top1Share).toBe(0)
    expect(result.risk).toBe('green')
  })
})

describe('concentrationRisk', () => {
  it('uses the same thresholds as the legacy implementation', () => {
    expect(concentrationRisk(49.99)).toBe('green')
    expect(concentrationRisk(50)).toBe('yellow')
    expect(concentrationRisk(75)).toBe('yellow')
    expect(concentrationRisk(75.01)).toBe('red')
  })
})
