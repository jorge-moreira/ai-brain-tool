import React, { useState, useEffect } from 'react';
import { Wizard } from './components/Wizard';
import { rpc } from './lib/rpc';

function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-background">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-semibold text-foreground">AI Brain Dashboard</h1>
        <p className="text-muted-foreground text-lg">Your brain is ready to use!</p>
      </div>
    </div>
  );
}

function App() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if global installation was done (uv + AI tools configured)
    rpc.checkInstallation()
      .then(result => {
        console.log('Installation check:', result.installed);
        setIsInstalled(result.installed);
      })
      .catch(error => {
        console.error('Failed to check installation:', error);
        setIsInstalled(false);
      });
  }, []);

  const handleWizardComplete = () => {
    setIsInstalled(true);
  };

  if (isInstalled === null) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return isInstalled ? (
    <Dashboard />
  ) : (
    <Wizard onComplete={handleWizardComplete} />
  );
}

export default App;
