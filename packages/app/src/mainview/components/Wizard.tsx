import React, { useState } from 'react';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { UVInstallScreen } from '../screens/UVInstallScreen';
import { AIToolsScreen } from '../screens/AIToolsScreen';
import { CompleteScreen } from '../screens/CompleteScreen';
import { useTheme } from '@ai-brain/ui/hooks/useTheme';
import { Button } from '@ai-brain/ui/components/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import { rpc } from '../lib/rpc';

type WizardStep = 'welcome' | 'uv' | 'ai-tools' | 'complete';

interface WizardProps {
  onComplete: () => void;
}

export function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const { theme, mode, toggleTheme, setTheme } = useTheme();

  const goToStep = (newStep: WizardStep) => {
    setStep(newStep);
  };

  const handleWelcomeNext = () => {
    goToStep('uv');
  };

  const handleUVComplete = () => {
    goToStep('ai-tools');
  };

  const handleUVBack = () => {
    goToStep('welcome');
  };

  const handleAIToolsComplete = (tools: string[]) => {
    setSelectedTools(tools);
    goToStep('complete');
  };

  const handleAIToolsBack = () => {
    goToStep('uv');
  };

  const handleComplete = async () => {
    setIsInstalling(true);
    // Mark installation as complete (uv installed, AI tools configured)
    // Pass empty extras (graphifyy extras not selected in app) and selected AI tools
    const result = await rpc.completeInstallation([], selectedTools);
    setIsInstalling(false);
    
    if (result.success) {
      onComplete();
    } else {
      console.error('Failed to complete installation:', result.error);
      // Still proceed even if brain setup fails
      onComplete();
    }
  };

  const cycleTheme = () => {
    if (mode === 'system') {
      setTheme('dark');
    } else if (mode === 'dark') {
      setTheme('light');
    } else {
      setTheme('system');
    }
  };

  const getThemeIcon = () => {
    if (mode === 'system') return Monitor;
    if (mode === 'dark') return Moon;
    return Sun;
  };

  const ThemeIcon = getThemeIcon();

  return (
    <div className="flex items-center justify-center w-full h-full p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          className="h-10 w-10 rounded-full"
          title={`Theme: ${mode} (click to change)`}
        >
          <ThemeIcon className="h-5 w-5" />
        </Button>
      </div>

      {step === 'welcome' && (
        <WelcomeScreen onNext={handleWelcomeNext} />
      )}
      {step === 'uv' && (
        <UVInstallScreen onComplete={handleUVComplete} onBack={handleUVBack} />
      )}
      {step === 'ai-tools' && (
        <AIToolsScreen onComplete={handleAIToolsComplete} onBack={handleAIToolsBack} />
      )}
      {step === 'complete' && (
        <CompleteScreen selectedTools={selectedTools} onFinish={handleComplete} />
      )}
    </div>
  );
}
