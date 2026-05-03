import React from 'react';
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
  const [status, setStatus] = React.useState<'installing' | 'done' | 'error'>('installing');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  React.useEffect(() => {
    async function installSkills() {
      try {
        const result = await rpc.installSkills(selectedTools);
        if (result.success) {
          setStatus('done');
          setTimeout(onFinish, 1500);
        } else {
          setStatus('error');
          setErrorMessage(result.error || 'Failed to install skills');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    installSkills();
  }, [selectedTools, onFinish]);

  return (
    <Card className="w-full max-w-md">
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
          <Alert>
            <AlertDescription>
              Setup complete! AI Brain is ready to use.
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
      <CardFooter>
        {status === 'error' && (
          <Button onClick={onFinish} variant="outline">
            Continue Anyway
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
