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

  console.log('[Wizard] Current step:', step);

  const goToStep = (newStep: WizardStep) => {
    console.log('[Wizard] Going to step:', newStep);
    setStep(newStep);
  };

  const handleWelcomeNext = () => {
    console.log('[Wizard] Welcome next clicked');
    goToStep('uv');
  };

  const handleUVComplete = () => {
    console.log('[Wizard] UV complete');
    goToStep('ai-tools');
  };

  const handleUVBack = () => {
    console.log('[Wizard] UV back');
    goToStep('welcome');
  };

  const handleAIToolsComplete = (tools: string[]) => {
    console.log('[Wizard] AI tools complete, selected:', tools);
    setSelectedTools(tools);
    goToStep('complete');
  };

  const handleAIToolsBack = () => {
    console.log('[Wizard] AI tools back');
    goToStep('uv');
  };

  const handleComplete = async () => {
    console.log('[Wizard] Complete, resizing window');
    await window.electronAPI.resizeWindow('dashboard');
    onComplete();
  };

  console.log('[Wizard] Rendering step:', step);

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
        <CompleteScreen onFinish={handleComplete} />
      )}
    </div>
  );
}
