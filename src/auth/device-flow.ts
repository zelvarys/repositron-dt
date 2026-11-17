import chalk from 'chalk'
import open from 'open'
import { z } from 'zod'
import { saveToken } from './config.js'

const DEVICE_CODE_URL = 'https://github.com/login/device/code'
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const DEFAULT_CLIENT_ID = 'Ov23liFJY12v9rTh1fZc'
const REQUEST_TIMEOUT_MS = 20_000
const MIN_POLL_INTERVAL_SECONDS = 5

const deviceCodeSchema = z.object({
  device_code: z.string(),
  user_code: z.string(),
  verification_uri: z.string(),
  verification_uri_complete: z.string().optional(),
  expires_in: z.coerce.number(),
  interval: z.coerce.number().optional(),
})

const tokenSchema = z.object({
  access_token: z.string().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
  interval: z.coerce.number().optional(),
})

type DeviceCodeResponse = z.infer<typeof deviceCodeSchema>
type TokenResponse = z.infer<typeof tokenSchema>

export class DeviceFlowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeviceFlowError'
  }
}

export function getClientId(): string {
  return (
    process.env.REPOSITRON_GITHUB_CLIENT_ID ??
    process.env.GITHUB_CLIENT_ID ??
    DEFAULT_CLIENT_ID
  )
}

async function postForm(
  url: string,
  body: Record<string, string>,
): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'repositron',
    },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const text = await response.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new DeviceFlowError(
      `GitHub returned an unreadable response (${response.status}).`,
    )
  }

  if (!response.ok) {
    const error = data as { error?: string; error_description?: string }
    throw new DeviceFlowError(
      `GitHub device flow failed (${response.status}): ${
        error.error_description ?? error.error ?? text.slice(0, 160)
      }`,
    )
  }

  return data
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function requestDeviceCode(clientId: string): Promise<DeviceCodeResponse> {
  const data = await postForm(DEVICE_CODE_URL, {
    client_id: clientId,
    scope: 'public_repo read:user read:org',
  })
  const parsed = deviceCodeSchema.safeParse(data)
  if (!parsed.success) {
    throw new DeviceFlowError('GitHub returned an invalid device code response.')
  }
  return parsed.data
}

async function requestAccessToken(
  clientId: string,
  deviceCode: string,
): Promise<TokenResponse> {
  const data = await postForm(ACCESS_TOKEN_URL, {
    client_id: clientId,
    device_code: deviceCode,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  })
  const parsed = tokenSchema.safeParse(data)
  if (!parsed.success) {
    throw new DeviceFlowError('GitHub returned an invalid token response.')
  }
  return parsed.data
}

export async function runDeviceFlow(): Promise<string> {
  const clientId = getClientId()
  const device = await requestDeviceCode(clientId)
  const verificationUrl = device.verification_uri_complete ?? device.verification_uri
  let interval = Math.max(
    MIN_POLL_INTERVAL_SECONDS,
    device.interval ?? MIN_POLL_INTERVAL_SECONDS,
  )

  console.log()
  console.log(chalk.bold('GitHub login required'))
  console.log(`1. Open ${chalk.cyan(verificationUrl)}`)
  console.log(`2. Enter code ${chalk.bold.green(device.user_code)}`)
  console.log()
  console.log(chalk.gray('Waiting for authorization...'))

  try {
    await open(verificationUrl)
  } catch {
    // The URL is printed above; opening a browser is best-effort.
  }

  const expiresAt = Date.now() + device.expires_in * 1000

  while (Date.now() < expiresAt) {
    const token = await requestAccessToken(clientId, device.device_code)

    if (token.access_token) {
      saveToken(token.access_token)
      console.log(chalk.green('Authorized. Starting Repositron.'))
      return token.access_token
    }

    if (token.error === 'authorization_pending') {
      await sleep(interval * 1000)
      continue
    }

    if (token.error === 'slow_down') {
      interval += token.interval ?? 5
      await sleep(interval * 1000)
      continue
    }

    if (token.error === 'expired_token') {
      throw new DeviceFlowError('The device code expired. Run repositron again.')
    }

    if (token.error === 'access_denied') {
      throw new DeviceFlowError('GitHub authorization was denied.')
    }

    throw new DeviceFlowError(
      `GitHub authorization failed: ${
        token.error_description ?? token.error ?? 'unknown error'
      }`,
    )
  }

  throw new DeviceFlowError('The device code expired. Run repositron again.')
}
