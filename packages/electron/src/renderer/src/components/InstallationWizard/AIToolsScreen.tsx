import { useEffect, useState } from 'react'
import { Button } from '@ai-brain/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@ai-brain/ui'
import { Checkbox } from '@ai-brain/ui'
import { Label } from '@ai-brain/ui'
import { Alert, AlertDescription } from '@ai-brain/ui'
import { Info } from 'lucide-react'

interface DetectedPlatform {
  key: string
  name: string
  detected: boolean
  configHint?: string
}

interface AIToolsScreenProps {
  onNext: (selected: string[]) => void
  onSkip: () => void
}

export function AIToolsScreen({ onNext, onSkip }: AIToolsScreenProps) {
  const [platforms, setPlatforms] = useState<DetectedPlatform[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const detectPlatforms = async () => {
      // Mock for browser testing
      if (!window.electronAPI) {
        console.log('Running in browser - mocking platform detection')
        const mockPlatforms: DetectedPlatform[] = [
          { key: 'claude', name: 'Claude Code', detected: false, configHint: '~/.claude/' },
          { key: 'opencode', name: 'OpenCode', detected: false, configHint: '~/.config/opencode/' },
          { key: 'cursor', name: 'Cursor', detected: false, configHint: '~/.cursor/' },
        ]
        setPlatforms(mockPlatforms)
        setIsLoading(false)
        return
      }

      try {
        const result = await window.electronAPI.detectPlatforms()
        if (result.success && result.data) {
          const detectedPlatforms: DetectedPlatform[] = result.data.map((p: any) => ({
            key: p.key,
            name: p.name,
            detected: p.detected,
            configHint: p.configHint
          }))
          setPlatforms(detectedPlatforms)
          const preselected = detectedPlatforms
            .filter(p => p.detected)
            .map(p => p.key)
          setSelected(preselected)
        }
      } catch (err) {
        console.error('Failed to detect platforms:', err)
      } finally {
        setIsLoading(false)
      }
    }

    detectPlatforms()
  }, [])

  const togglePlatform = (key: string) => {
    setSelected(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const handleContinue = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.installSkills(selected)
      } catch (err) {
        console.error('Failed to install skills:', err)
      }
    }
    onNext(selected)
  }

  const handleSkip = () => {
    onSkip()
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI Tools</CardTitle>
          <CardDescription>Detecting installed tools...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">Please wait</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>AI Tools</CardTitle>
        <CardDescription>Which AI coding assistants do you use?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            We'll install the /brain skill so you can use AI Brain commands.
            MCP configuration happens when you create your first brain.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {platforms.map((platform) => (
            <Label
              key={platform.key}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(platform.key)}
                onCheckedChange={() => togglePlatform(platform.key)}
              />
              <div className="flex-1">
                <p className="font-medium">{platform.name}</p>
                <p className="text-sm text-muted-foreground">
                  {platform.detected
                    ? `detected at ${platform.configHint}`
                    : 'not detected'}
                </p>
              </div>
            </Label>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={handleSkip}>Skip</Button>
        <Button onClick={handleContinue}>Continue</Button>
      </CardFooter>
    </Card>
  )
}
