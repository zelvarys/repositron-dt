#!/usr/bin/env node
import chalk from 'chalk'
import { render, type Instance } from 'ink'
import meow from 'meow'
import { createElement } from 'react'
import { resolveAuth } from './auth/check.js'
import {
  clearToken,
  saveUsername,
} from './auth/config.js'
import { runDeviceFlow } from './auth/device-flow.js'
import {
  GitHubAuthError,
  GitHubClient,
  getAuthenticatedUser,
} from './github/client.js'
import { App } from './ui/App.js'

const cli = meow(
  `
  Usage
    $ repositron

  Options
    --token <token>  Use a GitHub token instead of the saved session
    --help           Show this help
    --version        Show the version

  Repositron is an interactive terminal dashboard for GitHub repositories.
  On first run it starts GitHub's device flow and stores the session in
  ~/.config/repositron/config.json.
`,
  {
    importMeta: import.meta,
    flags: {
      token: { type: 'string' },
    },
  },
)

async function authenticate(): Promise<{
  token: string
  username: string
}> {
  let auth = cli.flags.token
    ? { token: cli.flags.token, source: 'env' as const }
    : await resolveAuth()

  try {
    const user = await getAuthenticatedUser(new GitHubClient(auth.token))
    saveUsername(user.login)
    return { token: auth.token, username: user.login }
  } catch (error) {
    if (!(error instanceof GitHubAuthError)) throw error
    if (cli.flags.token || auth.source === 'env') {
      throw new Error('The GitHub token is invalid or expired.')
    }

    clearToken()
    auth = { token: await runDeviceFlow(), source: 'device-flow' }
    const user = await getAuthenticatedUser(new GitHubClient(auth.token))
    saveUsername(user.login)
    return { token: auth.token, username: user.login }
  }
}

function clearTerminal(): void {
  if (process.stdout.isTTY) {
    process.stdout.write('\u001B[2J\u001B[3J\u001B[H')
  }
}

async function main(): Promise<void> {
  clearTerminal()
  const auth = await authenticate()
  let instance: Instance | null = null
  const clearScreen = (): void => {
    if (!instance) return
    instance.clear()
    clearTerminal()
  }

  instance = render(createElement(App, { ...auth, clearScreen }))
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(chalk.red(`Repositron failed: ${message}`))
  process.exitCode = 1
})
