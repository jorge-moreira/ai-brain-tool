import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-brain/ui/components/card';
import { Alert, AlertDescription } from '@ai-brain/ui/components/alert';
import { Progress } from '@ai-brain/ui/components/progress';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <Card className="w-full max-w-2xl card-rounded bg-card border-border shadow-lg">
      <CardHeader className="space-y-4 pb-6">
        <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          {status === 'installing' ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : status === 'done' ? (
            <CheckCircle2 className="w-10 h-10 text-primary" />
          ) : (
            <AlertCircle className="w-10 h-10 text-destructive" />
          )}
        </div>
        <CardTitle className="text-3xl font-semibold text-foreground">Finalizing Setup</CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          Configuring your AI tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        {status === 'installing' && (
          <>
            <Progress value={50} className="h-3 bg-surface-container-high" />
            <p className="text-base text-muted-foreground flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              Installing brain skills...
            </p>
          </>
        )}
        
        {status === 'done' && (
          <Alert className="alert-rounded bg-primary/10 border-primary/30">
            <AlertDescription className="text-primary-foreground font-medium text-base">
              <CheckCircle2 className="w-5 h-5 inline mr-2" />
              Setup complete! AI Brain is ready to use.
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="destructive" className="alert-rounded bg-destructive/10 border-destructive/30">
            <AlertDescription className="text-destructive-foreground text-base">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {status === 'error' && (
          <Button onClick={onFinish} variant="outline" className="btn-rounded h-12 border-border w-full">
            Continue Anyway
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
