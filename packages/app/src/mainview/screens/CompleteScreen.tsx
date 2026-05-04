import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-brain/ui/components/card';
import { Alert, AlertDescription } from '@ai-brain/ui/components/alert';
import { Progress } from '@ai-brain/ui/components/progress';
import { rpc } from '../lib/rpc';

interface CompleteScreenProps {
  selectedTools: string[];
  onFinish: () => void;
}

export function CompleteScreen({ selectedTools, onFinish }: CompleteScreenProps) {
  const [status, setStatus] = useState<'installing' | 'done' | 'error'>('installing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function completeInstallation() {
      try {
        const result = await rpc.completeInstallation([], selectedTools);
        if (result.success) {
          setStatus('done');
          setTimeout(onFinish, 1500);
        } else {
          setStatus('error');
          setErrorMessage(result.error || 'Failed to complete installation');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    completeInstallation();
  }, [selectedTools, onFinish]);

  return (
    <Card className="w-full max-w-md card-rounded">
      <CardHeader>
        <CardTitle>Finalizing Setup</CardTitle>
        <CardDescription>
          Configuring your AI tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'installing' && (
          <>
            <Progress value={50} className="h-2" />
            <p className="text-sm text-muted-foreground">Installing brain skills...</p>
          </>
        )}
        
        {status === 'done' && (
          <Alert className="alert-pill">
            <AlertDescription>
              Setup complete! AI Brain is ready to use.
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
      <CardFooter>
        {status === 'error' && (
          <Button onClick={onFinish} variant="outline" className="btn-pill">
            Continue Anyway
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
