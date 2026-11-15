import { homedir } from 'node:os'
import { join } from 'node:path'
import Conf from 'conf'

export type RepositronConfig = {
  token?: string
  username?: string
  savedAt?: string
}

export const config = new Conf<RepositronConfig>({
  projectName: 'repositron',
  cwd: join(homedir(), '.config', 'repositron'),
})

export function getStoredToken(): string | undefined {
  return config.get('token')
}

export function getStoredUsername(): string | undefined {
  return config.get('username')
}

export function saveToken(token: string, username?: string): void {
  config.set({
    token,
    savedAt: new Date().toISOString(),
    ...(username ? { username } : {}),
  })
}

export function saveUsername(username: string): void {
  config.set('username', username)
}

export function clearToken(): void {
  config.delete('token')
  config.delete('username')
  config.delete('savedAt')
}

export function getConfigPath(): string {
  return config.path
}
