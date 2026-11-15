import { describe, expect, it } from 'vitest'
import { aggregateCiHealth, filterCiRuns, worstWorkflow } from '../src/insights/ci.js'
import type { CiRun } from '../src/insights/types.js'

function run(overrides: Partial<CiRun>): CiRun {
  return {
    runId: 1,
    workflowName: 'CI',
    status: 'completed',
    conclusion: 'success',
    branch: 'main',
    actor: 'alice',
    startedAt: '2026-10-28T10:00:00.000Z',
    completedAt: '2026-10-28T10:01:00.000Z',
    durationSeconds: 60,
    url: null,
    ...overrides,
  }
}

describe('aggregateCiHealth', () => {
  it('ignores in-progress runs and aggregates completed runs', () => {
    const health = aggregateCiHealth([
      run({ runId: 1, durationSeconds: 60 }),
      run({
        runId: 2,
        conclusion: 'failure',
        completedAt: '2026-10-29T10:00:00.000Z',
        durationSeconds: 120,
      }),
      run({
        runId: 3,
        completedAt: '2026-10-27T10:00:00.000Z',
        durationSeconds: 30,
      }),
      run({
        runId: 4,
        workflowName: 'Deploy',
        status: 'in_progress',
        conclusion: null,
      }),
    ])

    expect(health.totalRuns).toBe(3)
    expect(health.successRate).toBe(66.67)
    expect(health.workflows).toEqual([
      {
        name: 'CI',
        totalRuns: 3,
        successfulRuns: 2,
        failedRuns: 1,
        successRate: 66.67,
        averageDurationSeconds: 70,
      },
    ])
    expect(health.recentFailures).toHaveLength(1)
    expect(health.recentFailures[0]).toMatchObject({
      runId: 2,
      workflowName: 'CI',
      conclusion: 'failure',
    })
  })

  it('returns null when no runs have completed', () => {
    const health = aggregateCiHealth([
      run({ status: 'in_progress', conclusion: null }),
    ])
    expect(health.totalRuns).toBe(0)
    expect(health.successRate).toBeNull()
    expect(health.workflows).toEqual([])
  })

  it('preserves partial and fetched-at metadata', () => {
    const health = aggregateCiHealth([], true, '2026-10-29T00:00:00.000Z')
    expect(health.partial).toBe(true)
    expect(health.fetchedAt).toBe('2026-10-29T00:00:00.000Z')
  })
})

describe('filterCiRuns', () => {
  it('filters by workflow, branch, and completed-time range', () => {
    const runs = [
      run({ runId: 1, branch: 'main' }),
      run({ runId: 2, branch: 'feature', workflowName: 'Deploy' }),
      run({
        runId: 3,
        branch: 'main',
        completedAt: '2026-01-01T00:00:00.000Z',
      }),
    ]

    const filtered = filterCiRuns(runs, {
      branch: 'main',
      range: 30,
      now: new Date('2026-10-29T00:00:00.000Z'),
    })

    expect(filtered.map((item) => item.runId)).toEqual([1])
    expect(
      filterCiRuns(runs, {
        workflow: 'Deploy',
        now: new Date('2026-10-29T00:00:00.000Z'),
      }).map((item) => item.runId),
    ).toEqual([2])
  })
})

describe('worstWorkflow', () => {
  it('reports the lowest success rate only when enough data exists', () => {
    const runs = [
      ...Array.from({ length: 11 }, (_, index) =>
        run({ runId: index + 1, workflowName: 'CI' }),
      ),
      ...Array.from({ length: 11 }, (_, index) =>
        run({
          runId: index + 100,
          workflowName: 'Deploy',
          conclusion: 'failure',
        }),
      ),
    ]
    const health = aggregateCiHealth(runs)
    expect(worstWorkflow(health)).toBe('Deploy')
    expect(worstWorkflow(aggregateCiHealth([run({})]))).toBeNull()
  })
})
