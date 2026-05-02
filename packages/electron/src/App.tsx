import React, { useState, useEffect } from 'react';
import { Wizard } from './components/Wizard';

function Dashboard() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI Brain Dashboard</h1>
        <p className="text-muted-foreground">Your brain is ready to use!</p>
      </div>
    </div>
  );
}

export function App() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const setupDone = localStorage.getItem('ai-brain-setup-complete') === 'true';
    setIsSetupComplete(setupDone);
  }, []);

  const handleWizardComplete = () => {
    localStorage.setItem('ai-brain-setup-complete', 'true');
    setIsSetupComplete(true);
  };

  if (isSetupComplete === null) {
    return null;
  }

  return isSetupComplete ? (
    <Dashboard />
  ) : (
    <Wizard onComplete={handleWizardComplete} />
  );
}
