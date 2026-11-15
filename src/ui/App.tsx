import { useMemo, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import Spinner from 'ink-spinner'
import { GitHubClient } from '../github/client.js'
import type { GitHubRepo } from '../github/repos.js'
import { scanRepository, type ScanResult } from '../scan.js'
import { Header } from './components/Header.js'
import { StatusMessage } from './components/StatusMessage.js'
import { RepoPicker } from './screens/RepoPicker.js'
import { Dashboard } from './screens/Dashboard.js'

type AppProps = {
  token: string
  username?: string
}

type View = 'picker' | 'scanning' | 'dashboard' | 'error'

type ErrorScreenProps = {
  message: string
  onBack: () => void
}

function ErrorScreen({ message, onBack }: ErrorScreenProps) {
  useInput((input, key) => {
    if (input === 'q' || key.escape) onBack()
  })

  return (
    <Box flexDirection="column">
      <Header />
      <Box
        borderStyle="single"
        borderColor="red"
        flexDirection="column"
        paddingX={1}
        paddingY={1}
      >
        <Text bold color="red">
          Scan failed
        </Text>
        <StatusMessage tone="error">{message}</StatusMessage>
        <Box marginTop={1}>
          <Text color="gray">q or Esc returns to the repository picker.</Text>
        </Box>
      </Box>
    </Box>
  )
}

export function App({ token, username }: AppProps) {
  const client = useMemo(() => new GitHubClient(token), [token])
  const [view, setView] = useState<View>('picker')
  const [scanningRepo, setScanningRepo] = useState<GitHubRepo | null>(null)
  const [scanMessage, setScanMessage] = useState('Starting scan...')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startScan = (repo: GitHubRepo) => {
    setScanningRepo(repo)
    setResult(null)
    setError(null)
    setScanMessage('Starting scan...')
    setView('scanning')

    scanRepository(client, repo, setScanMessage)
      .then((scanResult) => {
        setResult(scanResult)
        setView('dashboard')
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : String(reason))
        setView('error')
      })
  }

  const backToPicker = () => {
    setResult(null)
    setScanningRepo(null)
    setError(null)
    setView('picker')
  }

  if (view === 'scanning') {
    return (
      <Box flexDirection="column">
        <Header repo={scanningRepo ?? undefined} username={username} />
        <Box
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
          paddingX={1}
          paddingY={1}
        >
          <Text bold color="cyan">
            Scanning {scanningRepo?.full_name ?? 'repository'}
          </Text>
          <Text>
            <Spinner type="dots" /> {scanMessage}
          </Text>
          <Box marginTop={1}>
            <Text color="gray">
              Large repositories can take a minute. Ctrl+C exits.
            </Text>
          </Box>
        </Box>
      </Box>
    )
  }

  if (view === 'dashboard' && result) {
    return (
      <Dashboard result={result} username={username} onBack={backToPicker} />
    )
  }

  if (view === 'error') {
    return (
      <ErrorScreen
        message={error ?? 'Unknown error'}
        onBack={backToPicker}
      />
    )
  }

  return (
    <RepoPicker client={client} username={username} onSelect={startScan} />
  )
}
