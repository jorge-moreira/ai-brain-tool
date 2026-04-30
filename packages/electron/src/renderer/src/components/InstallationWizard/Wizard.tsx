import { useState } from 'react'
import { WelcomeScreen } from './WelcomeScreen'
import { UVInstallScreen } from './UVInstallScreen'
import { AIToolsScreen } from './AIToolsScreen'
import { CompleteScreen } from './CompleteScreen'

interface WizardProps {
  onComplete: () => void
}

type Screen = 'welcome' | 'uv' | 'aitools' | 'complete'

export function Wizard({ onComplete }: WizardProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')

  const handleWelcomeNext = () => {
    setCurrentScreen('uv')
  }

  const handleUvSuccess = () => {
    setCurrentScreen('aitools')
  }

  const handleAIToolsNext = (_selected: string[]) => {
    setCurrentScreen('complete')
  }

  const handleAIToolsSkip = () => {
    setCurrentScreen('complete')
  }

  const handleLaunch = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.setWizardCompleted(true)
      } catch (err) {
        console.error('Failed to set wizard completed:', err)
      }
    }
    onComplete()
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={handleWelcomeNext} />
      case 'uv':
        return <UVInstallScreen onSuccess={handleUvSuccess} />
      case 'aitools':
        return (
          <AIToolsScreen
            onNext={handleAIToolsNext}
            onSkip={handleAIToolsSkip}
          />
        )
      case 'complete':
        return <CompleteScreen onLaunch={handleLaunch} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {renderScreen()}
    </div>
  )
}
