import { useMemo, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { GitHubClient } from '../github/client.js'
import type { GitHubRepo } from '../github/repos.js'
import { scanRepository, type ScanResult } from '../scan.js'
import { colors } from './theme.js'
import { TerminalFrame } from './viewport.js'
import { Card } from './components/Card.js'
import { Footer } from './components/Footer.js'
import { Header } from './components/Header.js'
import { StatusMessage } from './components/StatusMessage.js'
import { RepoPicker } from './screens/RepoPicker.js'
import { ScanningScreen } from './screens/ScanningScreen.js'
import { Dashboard } from './screens/Dashboard.js'

type AppProps = {
  token: string
  username: string
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
    <Box flexDirection="column" flexGrow={1}>
      <Header tab="error" />
      <Box flexGrow={1} paddingX={1} marginTop={1}>
        <Card title="Scan interrupted" borderColor={colors.red}>
          <StatusMessage tone="error">{message}</StatusMessage>
          <Box marginTop={1}>
            <Text color={colors.muted}>
              Press q or Esc to return to the repository picker.
            </Text>
          </Box>
        </Card>
      </Box>
      <Footer hints="q or Esc returns to the repository picker" />
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

  let screen = (
    <RepoPicker client={client} username={username} onSelect={startScan} />
  )

  if (view === 'scanning') {
    screen = <ScanningScreen repo={scanningRepo} message={scanMessage} />
  } else if (view === 'dashboard' && result) {
    screen = <Dashboard result={result} onBack={backToPicker} />
  } else if (view === 'error') {
    screen = (
      <ErrorScreen
        message={error ?? 'Unknown error'}
        onBack={backToPicker}
      />
    )
  }

  return <TerminalFrame>{screen}</TerminalFrame>
}
