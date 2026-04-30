import { useEffect, useState } from 'react'
import { Button } from '@ai-brain/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@ai-brain/ui'
import { Progress } from '@ai-brain/ui'
import { Alert, AlertDescription, AlertTitle } from '@ai-brain/ui'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface UVInstallScreenProps {
  onSuccess: () => void
}

type InstallStatus = 'checking' | 'downloading' | 'installing' | 'verifying' | 'complete' | 'error'

export function UVInstallScreen({ onSuccess }: UVInstallScreenProps) {
  const [status, setStatus] = useState<InstallStatus>('checking')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const installUv = async () => {
    setStatus('checking')
    setProgress(10)
    setErrorMessage(null)

    // Mock for browser testing
    if (!window.electronAPI) {
      console.log('Running in browser - mocking UV install')
      const steps = ['downloading', 'installing', 'verifying']
      for (const step of steps) {
        setStatus(step as InstallStatus)
        setProgress(prev => prev + 30)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      setStatus('complete')
      setTimeout(() => onSuccess(), 500)
      return
    }

    try {
      const result = await window.electronAPI.ensureUv()
      
      if (result.success) {
        setStatus('complete')
        setProgress(100)
        setTimeout(() => onSuccess(), 500)
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'UV installation failed')
        setProgress(0)
      }
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'UV installation failed')
      setProgress(0)
    }
  }

  useEffect(() => {
    installUv()
  }, [])

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking for UV...'
      case 'downloading':
        return 'Downloading UV...'
      case 'installing':
        return 'Installing UV...'
      case 'verifying':
        return 'Verifying installation...'
      case 'complete':
        return 'Installation complete!'
      case 'error':
        return ''
      default:
        return ''
    }
  }

  const handleRetry = () => {
    installUv()
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Setting up Python Environment</CardTitle>
        <CardDescription>AI Brain uses Python to process your documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-center text-muted-foreground">
          {getStatusMessage()}
        </p>
        
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {status === 'complete' && (
          <Alert className="bg-green-50 text-green-900 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>UV is installed and ready to use</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {status === 'error' && (
          <Button className="w-full" onClick={handleRetry}>Retry</Button>
        )}
      </CardFooter>
    </Card>
  )
}
