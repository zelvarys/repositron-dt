import { useMemo, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { GitHubClient } from '../github/client.js'
import type { GitHubRepo } from '../github/repos.js'
import { scanRepository, type ScanResult } from '../scan.js'
import { border } from './theme.js'
import { Header } from './components/Header.js'
import { StatusMessage } from './components/StatusMessage.js'
import { RepoPicker } from './screens/RepoPicker.js'
import { ScanningScreen } from './screens/ScanningScreen.js'
import { Dashboard } from './screens/Dashboard.js'

type AppProps = {
  token: string
  username: string
  clearScreen: () => void
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
      <Header tab="error" />
      <Box
        borderStyle={border}
        borderColor="red"
        flexDirection="column"
        marginTop={1}
        paddingX={2}
        paddingY={1}
      >
        <Text bold color="red">
          SCAN INTERRUPTED
        </Text>
        <StatusMessage tone="error">{message}</StatusMessage>
        <Box marginTop={1}>
          <Text color="white">q or Esc returns to the repository picker.</Text>
        </Box>
      </Box>
    </Box>
  )
}

export function App({ token, username, clearScreen }: AppProps) {
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
    clearScreen()
    setResult(null)
    setScanningRepo(null)
    setError(null)
    setView('picker')
  }

  if (view === 'scanning') {
    return (
      <ScanningScreen repo={scanningRepo} message={scanMessage} />
    )
  }

  if (view === 'dashboard' && result) {
    return (
      <Dashboard result={result} onBack={backToPicker} />
    )
  }

  if (view === 'error') {
    return (
      <ErrorScreen message={error ?? 'Unknown error'} onBack={backToPicker} />
    )
  }

  return (
    <RepoPicker client={client} username={username} onSelect={startScan} />
  )
}
