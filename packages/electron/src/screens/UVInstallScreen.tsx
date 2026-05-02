import React, { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-brain/ui/components/card';
import { Progress } from '@ai-brain/ui/components/progress';
import { Alert, AlertDescription } from '@ai-brain/ui/components/alert';

interface UVInstallScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export function UVInstallScreen({ onComplete, onBack }: UVInstallScreenProps) {
  const [status, setStatus] = useState<'checking' | 'installing' | 'done' | 'error'>('checking');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  console.log('[UVInstallScreen] Render, status:', status);

  useEffect(() => {
    console.log('[UVInstallScreen] useEffect triggered');
    
    async function installUv() {
      try {
        console.log('[UVInstallScreen] Starting install, setting status to installing');
        setStatus('installing');
        setProgress(30);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[UVInstallScreen] Progress 60%');
        setProgress(60);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[UVInstallScreen] Progress 100%, status done');
        setProgress(100);
        
        setStatus('done');
        
        console.log('[UVInstallScreen] Calling onComplete in 1s');
        setTimeout(onComplete, 1000);
      } catch (error) {
        console.error('[UVInstallScreen] Error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    installUv();
  }, [onComplete]);

  return (
    <Card className="w-full max-w-md">
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
          <Alert>
            <AlertDescription>
              UV installed successfully!
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {status === 'error' && (
          <>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Retry
            </Button>
          </>
        )}
        {status !== 'error' && status !== 'checking' && (
          <Button onClick={onComplete} className="w-full" disabled={status !== 'done'}>
            Continue
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
