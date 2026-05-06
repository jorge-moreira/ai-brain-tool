import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Progress } from '@ai-brain/ui/components/progress';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface GraphifyInstallScreenProps {
  selectedExtras: string[];
  onComplete: () => void;
}

export function GraphifyInstallScreen({ selectedExtras, onComplete }: GraphifyInstallScreenProps) {
  const [status, setStatus] = useState<'installing' | 'done'>('installing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function installGraphify() {
      try {
        setProgress(30);
        
        // Simulate Graphify installation with extras
        // TODO: Replace with actual Graphify installation logic
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setProgress(60);
        
        // Install selected extras
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setProgress(100);
        setStatus('done');
        
        setTimeout(onComplete, 1000);
      } catch (error) {
        console.error('Failed to install Graphify:', error);
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
            <Loader2 className="w-10 h-10 text-secondary animate-spin" />
          ) : (
            <CheckCircle2 className="w-10 h-10 text-secondary" />
          )}
        </div>
        <h2 className="card-title">Installing Graphify</h2>
        <p className="card-description">Setting up your knowledge graph</p>
      </div>
      
      <div className="card-content">
        <div className="progress-container">
          <Progress value={progress} className="h-3" />
          <p className="status-text">{extrasText}</p>
        </div>
      </div>
      
      {status === 'done' && (
        <Button onClick={onComplete} className="btn-primary w-full">
          Continue
        </Button>
      )}
    </div>
  );
}
