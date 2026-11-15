import type { ScanContext } from './context.js'
import type {
  DetectionResult,
  RepoMetrics,
  ToolCategory,
  ToolDetector,
  ToolMetric,
} from './types.js'
import { jestDetector } from './detectors/jest.detector.js'
import { eslintDetector } from './detectors/eslint.detector.js'
import { prettierDetector } from './detectors/prettier.detector.js'
import { pytestDetector } from './detectors/pytest.detector.js'
import { blackDetector } from './detectors/black.detector.js'
import { ruffDetector } from './detectors/ruff.detector.js'
import { preCommitDetector } from './detectors/pre-commit.detector.js'
import { githubActionsDetector } from './detectors/github-actions.detector.js'
import { dependabotDetector } from './detectors/dependabot.detector.js'
import { renovateDetector } from './detectors/renovate.detector.js'
import { goTestDetector } from './detectors/go-test.detector.js'
import { golangciLintDetector } from './detectors/golangci-lint.detector.js'
import { phpunitDetector } from './detectors/phpunit.detector.js'

export const detectors: ToolDetector[] = [
  jestDetector,
  eslintDetector,
  prettierDetector,
  pytestDetector,
  blackDetector,
  ruffDetector,
  preCommitDetector,
  githubActionsDetector,
  dependabotDetector,
  renovateDetector,
  goTestDetector,
  golangciLintDetector,
  phpunitDetector,
]

const COMMIT_PRESENCE_TOOLS = new Set([
  'github-actions',
  'dependabot',
  'renovate',
])

const JS_TOOLS = new Set(['jest', 'eslint', 'prettier'])
const PYTHON_TOOLS = new Set(['pytest', 'black', 'ruff'])
const GO_TOOLS = new Set(['go-test', 'golangci-lint'])
const PHP_TOOLS = new Set(['phpunit'])

export type DetectedLanguages = {
  js: boolean
  python: boolean
  go: boolean
  php: boolean
}

export function detectLanguages(input: {
  rootFiles: string[]
  commitFilenames: string[]
  configFileKeys: string[]
}): DetectedLanguages {
  const allFiles = [...input.rootFiles, ...input.commitFilenames]
  const configs = new Set(input.configFileKeys)
  const hasExtension = (extension: string) =>
    allFiles.some((file) => file.endsWith(extension))
  const hasConfig = (...paths: string[]) =>
    paths.some((path) => configs.has(path))

  return {
    js:
      hasConfig('package.json') ||
      hasExtension('.js') ||
      hasExtension('.jsx') ||
      hasExtension('.ts') ||
      hasExtension('.tsx') ||
      hasExtension('.mjs') ||
      hasExtension('.cjs'),
    python:
      hasConfig(
        'pyproject.toml',
        'setup.py',
        'setup.cfg',
        'requirements.txt',
        'pytest.ini',
        'tox.ini',
      ) ||
      hasExtension('.py'),
    go: hasConfig('go.mod', 'go.sum') || hasExtension('.go'),
    php:
      hasConfig(
        'composer.json',
        'composer.lock',
        'phpunit.xml',
        'phpunit.xml.dist',
      ) ||
      hasExtension('.php'),
  }
}

export function languagesToArray(languages: DetectedLanguages): string[] {
  const result: string[] = []
  if (languages.js) result.push('js')
  if (languages.python) result.push('python')
  if (languages.go) result.push('go')
  if (languages.php) result.push('php')
  return result
}

export function isToolRelevant(
  toolName: string,
  languages: DetectedLanguages,
): boolean {
  if (JS_TOOLS.has(toolName)) return languages.js
  if (PYTHON_TOOLS.has(toolName)) return languages.python
  if (GO_TOOLS.has(toolName)) return languages.go
  if (PHP_TOOLS.has(toolName)) return languages.php
  return true
}

export function runDetectors(ctx: ScanContext): DetectionResult[] {
  return detectors.map((detector) => detector.detect(ctx))
}

export function buildToolMetrics(
  results: DetectionResult[],
  languages: DetectedLanguages,
  repoFullName: string,
): RepoMetrics {
  const tools: ToolMetric[] = results
    .map((result) => {
      const perContributor = result.perContributor ?? {}
      const logins = Object.keys(perContributor)
      return {
        name: result.tool,
        category: result.category,
        detected: result.detected,
        relevant: isToolRelevant(result.tool, languages),
        adoptionRate: result.adoptionRate,
        contributorCount: logins.length,
        contributorsUsing: logins.filter((login) => perContributor[login])
          .length,
        evidence: result.evidence as Record<string, unknown>,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const detectedTools = tools.filter((tool) => tool.detected)
  const relevantTools = tools.filter((tool) => tool.relevant)
  const scoredTools = detectedTools.filter(
    (tool) => tool.relevant && !COMMIT_PRESENCE_TOOLS.has(tool.name),
  )
  const adoption =
    scoredTools.length === 0
      ? 0
      : scoredTools.reduce((sum, tool) => sum + tool.adoptionRate, 0) /
        scoredTools.length

  return {
    repoFullName,
    adoptionScore: Math.round(adoption * 100) / 100,
    adoption: Math.round(adoption * 100) / 100,
    languages: languagesToArray(languages),
    toolsChecked: tools.length,
    toolsRelevant: relevantTools.length,
    toolsDetected: detectedTools.length,
    tools,
  }
}

export function toolsByCategory(
  tools: ToolMetric[],
): Array<{ category: ToolCategory; tools: ToolMetric[] }> {
  const groups = new Map<ToolCategory, ToolMetric[]>()
  for (const tool of tools) {
    const group = groups.get(tool.category) ?? []
    group.push(tool)
    groups.set(tool.category, group)
  }
  return [...groups.entries()]
    .map(([category, categoryTools]) => ({ category, tools: categoryTools }))
    .sort((a, b) => a.category.localeCompare(b.category))
}
