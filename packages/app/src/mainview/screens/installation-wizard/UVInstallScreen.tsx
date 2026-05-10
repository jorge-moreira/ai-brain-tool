import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { rpc } from '@/lib/rpc';
import { Icons } from '@ai-brain/ui/components/icons';

interface UVInstallScreenProps {
  onComplete: () => void;
}

export function UVInstallScreen({ onComplete }: UVInstallScreenProps) {
  const [status, setStatus] = useState<'installing' | 'done'>('installing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function installUv() {
      try {
        setProgress(30);

        const result = await rpc.ensureUv();
        setProgress(60);

        if (result.success) {
          setProgress(100);
          setStatus('done');
        }
      } catch (error) {
        console.error('Failed to install UV:', error);
      }
    }

    installUv();
  }, []);

  return (
    <div className="wizard-card">
      <div className="card-header">
        <div className="status-icon">
          {status === 'installing' ? (
            <Icons.loader className="w-10 h-10 text-secondary animate-spin" />
          ) : (
            <Icons.checkCircle className="w-10 h-10 text-secondary" />
          )}
        </div>
        <h2 className="card-title">Installing UV</h2>
        <p className="card-description">Fast Python package manager</p>
      </div>

      <div className="card-content">
        <div className="progress-container">
          <p className="status-text">
            {status === 'installing' ? 'Downloading and installing UV...' : 'UV installed successfully!'}
          </p>
        </div>
      </div>

      <Button
        onClick={onComplete}
        className="btn-primary w-full"
        disabled={status !== 'done'}
      >
        Continue
      </Button>
    </div>
  );
}
