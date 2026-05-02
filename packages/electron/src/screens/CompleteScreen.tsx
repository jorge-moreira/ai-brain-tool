import React from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-brain/ui/components/card';
import { Alert, AlertDescription } from '@ai-brain/ui/components/alert';

interface CompleteScreenProps {
  onFinish: () => void;
}

export function CompleteScreen({ onFinish }: CompleteScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Complete!</CardTitle>
          <CardDescription>
            AI Brain is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              All dependencies have been installed and your AI tools have been configured.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground">
            <p>You can now:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Create and manage brains</li>
              <li>Graph your codebase</li>
              <li>Use AI tools with brain context</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onFinish} className="w-full">
            Open AI Brain
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
