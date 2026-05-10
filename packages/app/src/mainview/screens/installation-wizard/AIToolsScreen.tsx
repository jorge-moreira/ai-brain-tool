import { useEffect, useState } from 'react';
import { Button } from '@ai-brain/ui/components/button';
import { Checkbox } from '@/components/atoms';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@ai-brain/ui/components/alert-dialog';
import {Icons} from '@ai-brain/ui/components/icons';
import type { AITool } from '@/types/index';
import { rpc } from '@/lib/rpc';

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

  const toggleTool = (key: string, checked?: boolean | 'indeterminate') => {
    setSelected(prev => {
      const next = new Set(prev);
      // If checked param provided, use it; otherwise toggle
      if (checked !== undefined && checked !== 'indeterminate') {
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      } else {
        // Toggle current state
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
      }
      return next;
    });
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

  const handleAlertConfirm = () => {
    setShowAlert(false);
  };

  return (
    <>
      <div className="wizard-card">
        <div className="card-header">
          <div className="logo-container">
            <Icons.wrench className="w-10 h-10 text-primary" />
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
                  >
                    <Checkbox
                      checked={selected.has(tool.key)}
                      onCheckedChange={(checked) => toggleTool(tool.key, checked)}
                    />
                    <div className="flex-1">
                      <div className="tool-name">{tool.name}</div>
                    </div>
                  </div>
                ))}
              </div>
              {isInstalling && (
                <div className="mt-4 p-4 rounded-md bg-primary/10 border border-primary text-primary flex items-center gap-3">
                  <Icons.wrench className="w-4 h-4 animate-spin flex-shrink-0" />
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

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>No Tools Selected</AlertDialogTitle>
            <AlertDialogDescription>
              Please select at least one AI tool to install brain skills, or click Skip to continue without any tools.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-end pt-6">
            <AlertDialogAction className="btn-primary" onClick={handleAlertConfirm}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
