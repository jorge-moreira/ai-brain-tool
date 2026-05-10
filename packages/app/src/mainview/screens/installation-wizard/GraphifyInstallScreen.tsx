import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Icons } from '@ai-brain/ui/components/icons';
import { rpc } from '@/lib/rpc';

interface GraphifyInstallScreenProps {
  selectedExtras: string[];
  onComplete: () => void;
}

export function GraphifyInstallScreen({ selectedExtras, onComplete }: GraphifyInstallScreenProps) {
  const [status, setStatus] = useState<'installing' | 'done'>('installing');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function installGraphify() {
      try {
        setProgress(30);
        
        // Start venv creation job
        const { jobId } = await rpc.startGlobalVenv(selectedExtras);
        
        // Poll for completion
        const pollInterval = setInterval(async () => {
          const status = await rpc.getVenvStatus(jobId);
          
          if (status.status === 'running') {
            setProgress(status.progress ?? 30);
          } else if (status.status === 'done') {
            clearInterval(pollInterval);
            setProgress(100);
            setStatus('done');
            
            // Save extras to config
            await rpc.saveExtras(selectedExtras);
            
            setTimeout(onComplete, 1000);
          } else if (status.status === 'error') {
            clearInterval(pollInterval);
            setErrorMessage(status.error || 'Failed to install Graphify');
          }
        }, 1000);
      } catch (error) {
        console.error('Failed to install Graphify:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    installGraphify();
  }, [selectedExtras, onComplete]);

  const extrasText = selectedExtras.length > 0 
    ? `Installing with ${selectedExtras.length} extra${selectedExtras.length > 1 ? 's' : ''}...`
    : 'Installing Graphify...';

  return (
    <div className="wizard-card">
      <div className="card-header">
        <div className="status-icon">
          {status === 'installing' ? (
            <Icons.loader className="w-10 h-10 text-secondary animate-spin" />
          ) : errorMessage ? (
            <Icons.checkCircle className="w-10 h-10 text-destructive" />
          ) : (
            <Icons.checkCircle className="w-10 h-10 text-secondary" />
          )}
        </div>
        <h2 className="card-title">Installing Graphify</h2>
        <p className="card-description">Setting up your knowledge graph</p>
      </div>
      
      <div className="card-content">
        <div className="progress-container">
          <p className="status-text">{extrasText}</p>
        </div>
        {errorMessage && (
          <p className="text-destructive text-sm mt-4">{errorMessage}</p>
        )}
      </div>
      
      {status === 'done' && (
        <Button onClick={onComplete} className="btn-primary w-full">
          Continue
        </Button>
      )}
    </div>
  );
}
