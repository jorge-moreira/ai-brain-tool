import React, { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-brain/ui/components/card';
import { Checkbox } from '@ai-brain/ui/components/checkbox';
import { Label } from '@ai-brain/ui/components/label';
import { Alert, AlertDescription } from '@ai-brain/ui/components/alert';

interface AITool {
  key: string;
  name: string;
  detected: boolean;
}

interface AIToolsScreenProps {
  onComplete: (selectedTools: string[]) => void;
  onBack: () => void;
}

export function AIToolsScreen({ onComplete, onBack }: AIToolsScreenProps) {
  const [tools, setTools] = useState<AITool[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectTools() {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const detectedTools: AITool[] = [
        { key: 'claude', name: 'Claude Code', detected: true },
        { key: 'opencode', name: 'OpenCode', detected: true },
        { key: 'cursor', name: 'Cursor', detected: false },
        { key: 'gemini', name: 'Gemini CLI', detected: false },
        { key: 'copilot', name: 'GitHub Copilot', detected: false },
        { key: 'codex', name: 'OpenAI Codex', detected: false },
      ];
      
      setTools(detectedTools);
      const preselected = new Set(detectedTools.filter(t => t.detected).map(t => t.key));
      setSelected(preselected);
      setIsLoading(false);
    }

    detectTools();
  }, []);

  const toggleTool = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleContinue = () => {
    onComplete(Array.from(selected));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Configure AI Tools</CardTitle>
        <CardDescription>
          Select which AI tools to integrate with AI Brain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Detecting AI tools...</p>
        ) : tools.length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              No AI tools detected. Please install at least one supported AI tool.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {tools.map(tool => (
              <div key={tool.key} className="flex items-center space-x-3">
                <Checkbox
                  id={tool.key}
                  checked={selected.has(tool.key)}
                  onCheckedChange={() => toggleTool(tool.key)}
                  disabled={!tool.detected}
                />
                <Label 
                  htmlFor={tool.key}
                  className={`flex-1 ${!tool.detected ? 'text-muted-foreground' : ''}`}
                >
                  {tool.name}
                  {!tool.detected && ' (not installed)'}
                </Label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1" disabled={selected.size === 0}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
