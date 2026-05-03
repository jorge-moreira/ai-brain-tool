import React from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-brain/ui/components/card';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to AI Brain</CardTitle>
        <CardDescription>
          Let's set up your environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This wizard will help you install the required dependencies and configure your AI tools.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={onNext} className="w-full">
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}
