import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Checkbox } from '@ai-brain/ui/components/checkbox';
import { Label } from '@ai-brain/ui/components/label';
import { Wrench, AlertCircle } from 'lucide-react';
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
  const [showAlert, setShowAlert] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

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

  const toggleTool = (key: string, checked?: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      // Use provided checked state, or toggle if not provided
      const shouldBeChecked = checked !== undefined ? checked : !next.has(key);
      if (shouldBeChecked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
    setShowAlert(false);
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      setShowAlert(true);
      return;
    }
    
    setShowAlert(false);
    setIsInstalling(true);
    
    try {
      const selectedArray = Array.from(selected);
      
      // Install skill files for selected tools
      const installResult = await rpc.installSkills(selectedArray);
      
      if (!installResult.success) {
        throw new Error(installResult.error || 'Failed to install skills');
      }
      
      // Save AI tools to config
      await rpc.saveAiTools(selectedArray);
      onComplete(selectedArray);
    } catch (error) {
      console.error('Failed to install skills:', error);
      setIsInstalling(false);
      setShowAlert(true);
    }
  };

  const handleSkip = async () => {
    // Save empty AI tools list to config
    await rpc.saveAiTools([]);
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
                    onCheckedChange={(checked) => toggleTool(tool.key, checked)}
                  />
                  <div className="flex-1">
                    <div className="tool-name">{tool.name}</div>
                    <div className="tool-status">Installed</div>
                  </div>
                </div>
              ))}
            </div>
            {showAlert && (
              <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive text-destructive flex items-center gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Please select at least one AI tool to continue, or click Skip.
                </span>
              </div>
            )}
            {isInstalling && (
              <div className="mt-4 p-4 rounded-md bg-primary/10 border border-primary text-primary flex items-center gap-3">
                <Wrench className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="text-sm">
                  Installing skills...
                </span>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="button-row">
        <Button onClick={handleConfirm} className="btn-primary flex-1" disabled={isInstalling}>
          {isInstalling ? 'Installing...' : 'Confirm'}
        </Button>
        <Button onClick={handleSkip} variant="outline" className="flex-1" disabled={isInstalling}>
          Skip
        </Button>
      </div>
    </div>
  );
}
