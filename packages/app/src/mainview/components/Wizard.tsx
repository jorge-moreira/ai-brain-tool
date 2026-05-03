import React, { useState } from 'react';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { UVInstallScreen } from '../screens/UVInstallScreen';
import { AIToolsScreen } from '../screens/AIToolsScreen';
import { CompleteScreen } from '../screens/CompleteScreen';

type WizardStep = 'welcome' | 'uv' | 'ai-tools' | 'complete';

interface WizardProps {
  onComplete: () => void;
}

export function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

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

  const handleComplete = () => {
    localStorage.setItem('ai-brain-setup-complete', 'true');
    onComplete();
  };

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
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
