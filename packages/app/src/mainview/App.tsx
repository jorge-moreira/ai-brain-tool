import React, { useState, useEffect } from 'react';
import { Wizard } from './components/Wizard';
import { rpc } from './lib/rpc';

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
