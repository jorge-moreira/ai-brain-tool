import { useState } from 'react'
import { WelcomeScreen } from '@/screens/installation-wizard/WelcomeScreen'
import { UVInstallScreen } from '@/screens/installation-wizard/UVInstallScreen'
import { GraphifyExtrasScreen } from '@/screens/installation-wizard/GraphifyExtrasScreen'
import { GraphifyInstallScreen } from '@/screens/installation-wizard/GraphifyInstallScreen'
import { AIToolsScreen } from '@/screens/installation-wizard/AIToolsScreen'
import { SummaryScreen } from '@/screens/installation-wizard/SummaryScreen'
import { useTheme } from '@ai-brain/ui/hooks/useTheme'
import { Button } from '@ai-brain/ui/components/button'
import { Icons } from '@ai-brain/ui/components/icons'

type WizardStep = 'welcome' | 'uv' | 'graphify-extras' | 'graphify-install' | 'ai-tools' | 'summary'

interface WizardProps {
  onComplete: () => void
}

export function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome')
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const { mode, setTheme } = useTheme()

  const goToStep = (newStep: WizardStep) => {
    setStep(newStep)
  }

  const handleWelcomeNext = () => {
    goToStep('uv')
  }

  const handleUVComplete = () => {
    goToStep('graphify-extras')
  }

  const handleGraphifyExtrasContinue = (extras: string[]) => {
    setSelectedExtras(extras)
    goToStep('graphify-install')
  }

  const handleGraphifyExtrasSkip = () => {
    setSelectedExtras([])
    goToStep('graphify-install')
  }

  const handleGraphifyInstallComplete = () => {
    goToStep('ai-tools')
  }

  const handleAIToolsComplete = (tools: string[]) => {
    setSelectedTools(tools)
    goToStep('summary')
  }

  const handleAIToolsSkip = () => {
    setSelectedTools([])
    goToStep('summary')
  }

  const handleSummaryClose = () => {
    window.close()
  }

  const handleSummaryLaunch = () => {
    onComplete()
  }

  const cycleTheme = () => {
    if (mode === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  const getThemeIcon = () => {
    return mode === 'dark' ? Icons.moon : Icons.sun
  }

  const ThemeIcon = getThemeIcon()

  return (
    <div className="flex items-center justify-center w-full h-full bg-background">
      <div className="absolute top-6 right-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          className="h-10 w-10 rounded-md border border-border hover:bg-accent transition-colors flex items-center justify-center"
          title={`Theme: ${mode} (click to toggle)`}
        >
          <ThemeIcon className="h-5 w-5" />
        </Button>
      </div>

      {step === 'welcome' && <WelcomeScreen onNext={handleWelcomeNext} />}
      {step === 'uv' && <UVInstallScreen onComplete={handleUVComplete} />}
      {step === 'graphify-extras' && (
        <GraphifyExtrasScreen
          selectedExtras={selectedExtras}
          onSelectExtras={setSelectedExtras}
          onContinue={() => handleGraphifyExtrasContinue(selectedExtras)}
          onSkip={handleGraphifyExtrasSkip}
        />
      )}
      {step === 'graphify-install' && (
        <GraphifyInstallScreen
          selectedExtras={selectedExtras}
          onComplete={handleGraphifyInstallComplete}
        />
      )}
      {step === 'ai-tools' && (
        <AIToolsScreen onComplete={handleAIToolsComplete} onSkip={handleAIToolsSkip} />
      )}
      {step === 'summary' && (
        <SummaryScreen
          selectedExtras={selectedExtras}
          selectedTools={selectedTools}
          onClose={handleSummaryClose}
          onLaunch={handleSummaryLaunch}
        />
      )}
    </div>
  )
}
