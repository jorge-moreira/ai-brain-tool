import { useState, useEffect } from 'react'
import { ThemeButton } from '@/components/atoms/ThemeButton'
import { useTheme } from '@ai-brain/ui/hooks/useTheme'

export interface ThemeSelectorProps {
  onThemeChange?: (theme: 'system' | 'dark' | 'light') => void
  initialTheme?: 'system' | 'dark' | 'light'
}

export function ThemeSelector({ onThemeChange, initialTheme = 'system' }: ThemeSelectorProps) {
  const { mode, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState<'system' | 'dark' | 'light'>(initialTheme)

  // Sync with initialTheme when it changes
  useEffect(() => {
    setSelectedTheme(initialTheme)
  }, [initialTheme])

  const handleThemeSelect = (theme: 'system' | 'dark' | 'light') => {
    setSelectedTheme(theme)
    setTheme(theme)
    onThemeChange?.(theme)
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Theme</label>
      <div className="flex gap-2">
        <ThemeButton
          label="System"
          active={selectedTheme === 'system'}
          onClick={() => handleThemeSelect('system')}
        />
        <ThemeButton
          label="Dark"
          active={selectedTheme === 'dark'}
          onClick={() => handleThemeSelect('dark')}
        />
        <ThemeButton
          label="Light"
          active={selectedTheme === 'light'}
          onClick={() => handleThemeSelect('light')}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Choose how the application appears. System theme follows your OS settings.
      </p>
    </div>
  )
}
