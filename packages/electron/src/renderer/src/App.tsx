import { useState, useEffect } from 'react'
import { Button } from '@ai-brain/ui'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ai-brain/ui'
import type { BrainStatus, IpcResponse } from '../../main/preload'

interface StatusState {
  loading: boolean
  status: BrainStatus | null
  error: string | null
}

export default function App() {
  const [statusState, setStatusState] = useState<StatusState>({
    loading: true,
    status: null,
    error: null,
  })

  const [setupRunning, setSetupRunning] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    loadStatus()
    setupUpdateListeners()
  }, [])

  const loadStatus = async () => {
    try {
      const result = await window.electronAPI.getStatus()
      if (result.success) {
        setStatusState({ loading: false, status: result.data || null, error: null })
      } else {
        setStatusState({ loading: false, status: null, error: result.error || 'Failed to load status' })
      }
    } catch (err) {
      setStatusState({
        loading: false,
        status: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const handleSetup = async () => {
    setSetupRunning(true)
    try {
      const result = await window.electronAPI.setup()
      if (result.success) {
        await loadStatus()
      }
    } finally {
      setSetupRunning(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const result = await window.electronAPI.update()
      if (result.success) {
        await loadStatus()
      }
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const handleQuit = async () => {
    await window.electronAPI.quit()
  }

  const setupUpdateListeners = () => {
    window.electronAPI.onUpdateAvailable(() => {
      setUpdateAvailable(true)
    })

    window.electronAPI.onUpdateDownloaded(() => {
      console.log('Update downloaded')
    })

    window.electronAPI.onUpdateError((_, error) => {
      console.error('Update error:', error)
    })
  }

  const renderStatusCard = () => {
    if (statusState.loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Fetching brain status</p>
          </CardContent>
        </Card>
      )
    }

    if (statusState.error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{statusState.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadStatus} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }

    const status = statusState.status
    if (!status) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No Status Available</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSetup} disabled={setupRunning}>
              {setupRunning ? 'Setting up...' : 'Setup Brain'}
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Brain Status</CardTitle>
          <CardDescription>Version {status.version}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <StatusItem label="Graph" status={status.graphExists} />
            <StatusItem label="Git Sync" status={status.gitSynced} />
            <StatusItem label="MCP Connection" status={status.mcpConnected} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpdate} variant="outline">
              Update
            </Button>
            <Button onClick={handleSetup} disabled={setupRunning} variant="secondary">
              {setupRunning ? 'Setting up...' : 'Re-setup'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Brain Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your AI Brain instances and configuration
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {renderStatusCard()}

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleQuit} variant="destructive" className="w-full">
                Quit Application
              </Button>
              {updateAvailable && (
                <div className="text-sm text-muted-foreground mt-2">
                  An update is available and will be installed on quit.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatusItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <span
        className={`text-sm font-medium ${
          status ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {status ? '✓' : '✗'}
      </span>
    </div>
  )
}
