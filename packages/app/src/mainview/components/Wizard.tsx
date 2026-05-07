import React, { useState } from 'react';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { UVInstallScreen } from '../screens/UVInstallScreen';
import { GraphifyExtrasScreen } from '../screens/GraphifyExtrasScreen';
import { GraphifyInstallScreen } from '../screens/GraphifyInstallScreen';
import { AIToolsScreen } from '../screens/AIToolsScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { useTheme } from '@ai-brain/ui/hooks/useTheme';
import { Button } from '@ai-brain/ui/components/button';
import { Moon, Sun } from 'lucide-react';
import { rpc } from '../lib/rpc';

type WizardStep = 'welcome' | 'uv' | 'graphify-extras' | 'graphify-install' | 'ai-tools' | 'summary';

interface WizardProps {
  onComplete: () => void;
}

export function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { theme, mode, toggleTheme, setTheme } = useTheme();

  const goToStep = (newStep: WizardStep) => {
    setStep(newStep);
  };

  const handleWelcomeNext = () => {
    goToStep('uv');
  };

  const handleUVComplete = () => {
    goToStep('graphify-extras');
  };

  const handleGraphifyExtrasContinue = (extras: string[]) => {
    setSelectedExtras(extras);
    goToStep('graphify-install');
  };

  const handleGraphifyExtrasSkip = () => {
    setSelectedExtras([]);
    goToStep('graphify-install');
  };

  const handleGraphifyInstallComplete = () => {
    goToStep('ai-tools');
  };

  const handleAIToolsComplete = (tools: string[]) => {
    setSelectedTools(tools);
    goToStep('summary');
  };

  const handleAIToolsSkip = () => {
    setSelectedTools([]);
    goToStep('summary');
  };

  const handleSummaryClose = () => {
    window.close();
  };

  const handleSummaryLaunch = () => {
    onComplete();
  };

  const cycleTheme = () => {
    if (mode === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const getThemeIcon = () => {
    return mode === 'dark' ? Moon : Sun;
  };

  const ThemeIcon = getThemeIcon();

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

      {step === 'welcome' && (
        <WelcomeScreen onNext={handleWelcomeNext} />
      )}
      {step === 'uv' && (
        <UVInstallScreen onComplete={handleUVComplete} />
      )}
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
  );
}
