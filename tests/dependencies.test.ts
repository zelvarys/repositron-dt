import { describe, expect, it } from 'vitest'
import {
  parseDependencies,
  registryUrl,
  summarizeDependencies,
} from '../src/insights/dependencies.js'

describe('parseDependencies', () => {
  it('parses supported manifests and deduplicates by ecosystem and name', () => {
    const result = parseDependencies({
      'package.json': JSON.stringify({
        dependencies: { react: '^19.0.0', local: 'workspace:*' },
        devDependencies: { react: '19.1.0', vitest: '^3.0.0' },
      }),
      'requirements.txt': '# runtime\nrequests==2.32.1\nflask>=3.0\n-e .\n',
      'go.mod': 'require (\n  github.com/spf13/cobra v1.8.0\n)\n',
      Gemfile: "gem 'rails', '~> 7.1'\ngem 'private', git: 'https://example.com/x'\n",
      'composer.json': JSON.stringify({
        require: { php: '^8.3', 'laravel/framework': '^11.0' },
      }),
    })

    expect(result.partial).toBe(false)
    expect(
      result.dependencies.find(
        (dependency) =>
          dependency.ecosystem === 'npm' && dependency.name === 'react',
      )?.version,
    ).toBe('19.0.0')
    expect(
      result.dependencies.some((dependency) => dependency.name === 'local'),
    ).toBe(false)
    expect(
      result.dependencies.find((dependency) => dependency.name === 'requests'),
    ).toMatchObject({ ecosystem: 'pypi', version: '2.32.1' })
    expect(
      result.dependencies.find(
        (dependency) => dependency.name === 'github.com/spf13/cobra',
      ),
    ).toMatchObject({ ecosystem: 'go', version: '1.8.0' })
    expect(
      result.dependencies.find((dependency) => dependency.name === 'rails'),
    ).toMatchObject({ ecosystem: 'rubygems', version: '7.1' })
    expect(
      result.dependencies.find(
        (dependency) => dependency.name === 'laravel/framework',
      ),
    ).toMatchObject({ ecosystem: 'packagist', version: '11.0' })
    expect(
      result.dependencies.some((dependency) => dependency.name === 'private'),
    ).toBe(false)
    expect(
      result.dependencies.some((dependency) => dependency.name === 'php'),
    ).toBe(false)
  })

  it('flags malformed manifests as partial without failing the scan', () => {
    const result = parseDependencies({
      'package.json': '{not valid json',
      'requirements.txt': 'requests==2.32.1',
    })

    expect(result.partial).toBe(true)
    expect(result.dependencies.map((dependency) => dependency.name)).toEqual([
      'requests',
    ])
  })
})

describe('summarizeDependencies', () => {
  it('counts dependencies by ecosystem', () => {
    const parsed = parseDependencies({
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }),
      'requirements.txt': 'requests==2.32.1\nflask==3.0.0\n',
    })
    const summary = summarizeDependencies(parsed)

    expect(summary.total).toBe(3)
    expect(summary.ecosystems).toEqual({ npm: 1, pypi: 2 })
    expect(summary.partial).toBe(false)
  })
})

describe('registryUrl', () => {
  it('returns registry links for each ecosystem', () => {
    expect(registryUrl({ ecosystem: 'npm', name: 'react', version: '1' })).toBe(
      'https://www.npmjs.com/package/react',
    )
    expect(
      registryUrl({ ecosystem: 'pypi', name: 'requests', version: '1' }),
    ).toBe('https://pypi.org/project/requests/')
    expect(
      registryUrl({ ecosystem: 'go', name: 'example.com/mod', version: '1' }),
    ).toBe('https://pkg.go.dev/example.com/mod')
  })
})
