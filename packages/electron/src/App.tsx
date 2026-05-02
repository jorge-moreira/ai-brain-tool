import React, { useState, useEffect } from 'react';
import { Wizard } from './components/Wizard';

// Placeholder for the main dashboard
function Dashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center">
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
    // Check if setup has been completed
    // This will read from localStorage or IPC
    const setupDone = localStorage.getItem('ai-brain-setup-complete') === 'true';
    setIsSetupComplete(setupDone);
  }, []);

  const handleWizardComplete = () => {
    localStorage.setItem('ai-brain-setup-complete', 'true');
    setIsSetupComplete(true);
  };

  // Show nothing while checking setup state
  if (isSetupComplete === null) {
    return null;
  }

  // Show wizard if setup not complete, otherwise show dashboard
  return isSetupComplete ? (
    <Dashboard />
  ) : (
    <Wizard onComplete={handleWizardComplete} />
  );
}
