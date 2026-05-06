import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Checkbox } from '@ai-brain/ui/components/checkbox';
import { Label } from '@ai-brain/ui/components/label';
import { Wrench } from 'lucide-react';
import type { AITool } from '../types';
import { rpc } from '../lib/rpc';

interface AIToolsScreenProps {
  onComplete: (selectedTools: string[]) => void;
  onSkip: () => void;
}

export function AIToolsScreen({ onComplete, onSkip }: AIToolsScreenProps) {
  const [tools, setTools] = useState<AITool[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectTools() {
      setIsLoading(true);
      try {
        const detectedTools = await rpc.detectAiTools();
        // Only show installed tools
        const installedTools = detectedTools.filter(t => t.detected);
        setTools(installedTools);
        // Start with none selected
        setSelected(new Set());
      } catch (error) {
        console.error('Failed to detect AI tools:', error);
      } finally {
        setIsLoading(false);
      }
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

  const handleConfirm = () => {
    onComplete(Array.from(selected));
  };

  const handleSkip = () => {
    onComplete([]);
  };

  return (
    <div className="wizard-card">
      <div className="card-header">
        <div className="logo-container">
          <Wrench className="w-10 h-10 text-primary" />
        </div>
        <h2 className="card-title">Configure AI Tools</h2>
        <p className="card-description">Select tools to install brain skills for</p>
      </div>
      
      <div className="card-content">
        {isLoading ? (
          <p className="text-muted-foreground text-center">Detecting AI tools...</p>
        ) : tools.length === 0 ? (
          <p className="text-muted-foreground text-center">No AI tools detected</p>
        ) : (
          <>
            <p className="text-muted-foreground mb-4 text-sm">
              Detected AI tools (select to install brain skills):
            </p>
            <div className="tools-list">
              {tools.map(tool => (
                <div 
                  key={tool.key} 
                  className="tool-item"
                  onClick={() => toggleTool(tool.key)}
                >
                  <Checkbox
                    checked={selected.has(tool.key)}
                    onCheckedChange={() => toggleTool(tool.key)}
                  />
                  <div className="flex-1">
                    <div className="tool-name">{tool.name}</div>
                    <div className="tool-status">Installed</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="button-row">
        <Button onClick={handleConfirm} className="btn-primary flex-1">
          Confirm
        </Button>
        <Button onClick={handleSkip} variant="outline" className="flex-1">
          Skip
        </Button>
      </div>
    </div>
  );
}
