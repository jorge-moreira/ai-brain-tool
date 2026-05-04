import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-brain/ui/components/card';
import { Progress } from '@ai-brain/ui/components/progress';
import { Alert, AlertDescription } from '@ai-brain/ui/components/alert';
import { rpc } from '../lib/rpc';

interface UVInstallScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export function UVInstallScreen({ onComplete, onBack }: UVInstallScreenProps) {
  const [status, setStatus] = useState<'checking' | 'installing' | 'done' | 'error'>('checking');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function installUv() {
      try {
        setStatus('installing');
        setProgress(30);
        
        const result = await rpc.ensureUv();
        setProgress(60);
        
        if (result.success) {
          setProgress(100);
          setStatus('done');
          setTimeout(onComplete, 1000);
        } else {
          setStatus('error');
          setErrorMessage(result.error || 'Failed to install UV');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    installUv();
  }, [onComplete]);

  return (
    <Card className="w-full max-w-md card-rounded">
      <CardHeader>
        <CardTitle>Installing UV</CardTitle>
        <CardDescription>
          Package manager for Python
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        
        {status === 'checking' && (
          <p className="text-sm text-muted-foreground">Checking installation...</p>
        )}
        
        {status === 'installing' && (
          <p className="text-sm text-muted-foreground">Downloading and installing UV...</p>
        )}
        
        {status === 'done' && (
          <Alert className="alert-pill">
            <AlertDescription>
              UV installed successfully!
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="destructive" className="alert-pill">
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {status === 'error' && (
          <>
            <Button variant="outline" onClick={onBack} className="btn-pill">
              Back
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1 btn-pill">
              Retry
            </Button>
          </>
        )}
        {status !== 'error' && status !== 'checking' && (
          <Button onClick={onComplete} className="w-full btn-pill" disabled={status !== 'done'}>
            Continue
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
