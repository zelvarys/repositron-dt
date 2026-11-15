import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getStoredToken } from './config.js'
import { runDeviceFlow } from './device-flow.js'

export type AuthSource = 'env' | 'config' | 'gh-cli' | 'device-flow'

export type AuthResult = {
  token: string
  source: AuthSource
}

export async function readGhCliToken(): Promise<string | null> {
  const configDir = process.env.GH_CONFIG_DIR ?? join(homedir(), '.config', 'gh')
  try {
    const hosts = await readFile(join(configDir, 'hosts.yml'), 'utf8')
    const match = /oauth_token:\s*["']?([^"'\s]+)["']?/.exec(hosts)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export async function resolveAuth(): Promise<AuthResult> {
  const envToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
  if (envToken?.trim()) {
    return { token: envToken.trim(), source: 'env' }
  }

  const stored = getStoredToken()
  if (stored?.trim()) {
    return { token: stored.trim(), source: 'config' }
  }

  const ghToken = await readGhCliToken()
  if (ghToken) {
    return { token: ghToken, source: 'gh-cli' }
  }

  const token = await runDeviceFlow()
  return { token, source: 'device-flow' }
}
