import { useEffect, useState } from 'react'
import { ThemeSelector } from '@/components/organisms/ThemeSelector'
import { AIToolsList } from '@/components/organisms/AIToolsList'
import { SettingsSection } from '@/components/molecules/SettingsSection'
import { IconButton } from '@/components/atoms/IconButton'
import { Icons } from '@ai-brain/ui/components/icons'
import { rpc } from '@/lib/rpc'
import { toast } from 'sonner'

interface ToolInfo {
  key: string
  name: string
  description: string
  detected: boolean
}

export function Settings() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [installedTools, setInstalledTools] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savedTheme, setSavedTheme] = useState<'system' | 'dark' | 'light' | null>(null)

  useEffect(() => {
    loadTools()
  }, [])

  async function loadTools() {
    try {
      // Detect available tools
      const detected = await rpc.detectAiTools()
      const toolInfos: ToolInfo[] = detected.map(d => ({
        key: d.key,
        name: d.name,
        description: getToolDescription(d.key),
        detected: d.detected
      }))
      setTools(toolInfos)

      // Get installed tools from preferences
      const prefs = await rpc.getPreferences()
      setInstalledTools(prefs.installedAiTools || [])
      setSavedTheme(prefs.theme || 'system')
    } catch (error) {
      toast.error('Failed to load tools', { duration: 2000 })
      console.error('Failed to load tools:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function getToolDescription(key: string): string {
    const descriptions: Record<string, string> = {
      claude: "Anthropic's AI coding assistant",
      gemini: "Google's AI coding assistant",
      cursor: 'AI-first code editor',
      copilot: "GitHub's AI pair programmer",
      codex: "OpenAI's coding assistant",
      opencode: 'Open source AI coding assistant'
    }
    return descriptions[key] || 'AI coding tool'
  }

  async function handleThemeChange(theme: 'system' | 'dark' | 'light') {
    try {
      await rpc.savePreferences({ theme })
      toast.success('Theme saved', { duration: 2000 })
    } catch (error) {
      toast.error('Failed to save theme', { duration: 2000 })
    }
  }

  function handleGoBack() {
    // Dispatch navigate-to-dashboard event
    if ((window as any).__navigateTo) {
      (window as any).__navigateTo('dashboard')
    } else {
      window.dispatchEvent(new CustomEvent('navigate-to', { detail: { view: 'dashboard' } }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <IconButton
            icon={<Icons.chevronLeft className="w-5 h-5" />}
            onClick={handleGoBack}
            className="border-0 hover:bg-primary/20"
          />
          <Icons.settings className="w-6 h-6 text-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl space-y-6">
          {/* Appearance */}
          <SettingsSection title="Appearance">
            <ThemeSelector
              onThemeChange={handleThemeChange}
              initialTheme={savedTheme || 'system'}
            />
          </SettingsSection>

          {/* AI Tools */}
          <SettingsSection title="AI Tools" showDivider>
            <AIToolsList tools={tools} installedTools={installedTools} />
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}
