import { describe, expect, it } from 'vitest'
import {
  buildToolMetrics,
  detectLanguages,
  runDetectors,
} from '../src/insights/tools.js'
import { buildCommit, buildContext } from './helpers/context.js'

function fixtureContext() {
  const packageJson = JSON.stringify({
    scripts: { test: 'jest', lint: 'eslint .', format: 'prettier --check .' },
    devDependencies: {
      jest: '^30.0.0',
      eslint: '^9.0.0',
      prettier: '^3.0.0',
    },
  })

  return buildContext({
    rootFiles: ['package.json', '.eslintrc.json'],
    configFiles: {
      'package.json': packageJson,
      '.eslintrc.json': '{}',
      '.github/workflows/ci.yml':
        'jobs:\n  test:\n    steps:\n      - run: npm test\n      - run: npx eslint .\n      - run: npx prettier --check .\n',
    },
    workflowFiles: ['.github/workflows/ci.yml'],
    contributors: [
      { login: 'alice', contributions: 10 },
      { login: 'bob', contributions: 5 },
    ],
    commits: [
      buildCommit({
        sha: 'a1',
        authorLogin: 'alice',
        filenames: ['src/widget.test.ts'],
      }),
      buildCommit({
        sha: 'b2',
        authorLogin: 'bob',
        filenames: ['src/widget.ts'],
      }),
    ],
  })
}

describe('runDetectors', () => {
  it('runs every detector and detects the JavaScript toolchain', () => {
    const results = runDetectors(fixtureContext())
    const byName = new Map(results.map((result) => [result.tool, result]))

    expect(results).toHaveLength(13)
    expect(byName.get('jest')?.detected).toBe(true)
    expect(byName.get('jest')?.adoptionRate).toBe(50)
    expect(byName.get('eslint')?.adoptionRate).toBe(100)
    expect(byName.get('prettier')?.adoptionRate).toBe(100)
    expect(byName.get('github-actions')?.detected).toBe(true)
    expect(byName.get('github-actions')?.adoptionRate).toBe(100)
    expect(byName.get('pytest')?.detected).toBe(false)
  })

  it('does not assign adoption when a tool is not configured', () => {
    const results = runDetectors(
      buildContext({
        contributors: [{ login: 'alice', contributions: 1 }],
        commits: [
          buildCommit({
            authorLogin: 'alice',
            filenames: ['src/widget.test.ts'],
          }),
        ],
      }),
    )

    const jest = results.find((result) => result.tool === 'jest')
    expect(jest?.detected).toBe(false)
    expect(jest?.adoptionRate).toBe(0)
  })
})

describe('buildToolMetrics', () => {
  it('computes a language-aware adoption score', () => {
    const ctx = fixtureContext()
    const languages = detectLanguages({
      rootFiles: ctx.rootFiles,
      commitFilenames: ctx.commits.flatMap((commit) =>
        commit.files.map((file) => file.filename),
      ),
      configFileKeys: Object.keys(ctx.configFiles),
    })
    const metrics = buildToolMetrics(
      runDetectors(ctx),
      languages,
      'acme/widget',
    )

    expect(metrics.languages).toEqual(['js'])
    expect(metrics.toolsChecked).toBe(13)
    expect(metrics.toolsDetected).toBe(4)
    expect(metrics.adoptionScore).toBe(83.33)
    expect(metrics.tools.find((tool) => tool.name === 'pytest')?.relevant).toBe(
      false,
    )
  })
})
