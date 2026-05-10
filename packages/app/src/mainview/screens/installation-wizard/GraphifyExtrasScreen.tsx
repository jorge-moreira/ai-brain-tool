import { Button } from '@ai-brain/ui/components/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@ai-brain/ui/components/alert-dialog';
import { Checkbox } from '@/components/atoms';
import { useState } from 'react';

interface GraphifyExtrasScreenProps {
  selectedExtras: string[];
  onSelectExtras: (extras: string[]) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export function GraphifyExtrasScreen({ selectedExtras, onSelectExtras, onContinue, onSkip }: GraphifyExtrasScreenProps) {
  const [showAlert, setShowAlert] = useState(false);

  const extras = [
    {
      id: 'video',
      name: 'Video Support',
      description: 'MP4, MP3, YouTube, etc.'
    },
    {
      id: 'office',
      name: 'Office Support',
      description: 'Word, Excel documents'
    }
  ];

  const toggleExtra = (id: string) => {
    if (selectedExtras.includes(id)) {
      onSelectExtras(selectedExtras.filter(e => e !== id));
    } else {
      onSelectExtras([...selectedExtras, id]);
    }
  };

  const handleContinue = () => {
    if (selectedExtras.length === 0) {
      setShowAlert(true);
    } else {
      onContinue();
    }
  };

  const handleAlertConfirm = () => {
    setShowAlert(false);
  };

  return (
    <>
      <div className="wizard-card">
        <div className="card-header">
          <div className="logo-container">
          <img src="/graphify.svg" alt="AI Brain" className="logo" />
        </div>
          <h2 className="card-title">Graphify Extras</h2>
          <p className="card-description">Select optional features</p>
        </div>
        
        <div className="card-content">
          <div className="extras-list">
            {extras.map(extra => (
              <div 
                key={extra.id} 
                className="extra-item"
              >
                <Checkbox
                  checked={selectedExtras.includes(extra.id)}
                  onCheckedChange={() => toggleExtra(extra.id)}
                />
                <div className="flex-1">
                  <div className="extra-name">{extra.name}</div>
                  <div className="extra-description">{extra.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="button-row">
          <Button onClick={handleContinue} className="btn-primary flex-1">
            Continue
          </Button>
          <Button onClick={onSkip} variant="outline" className="flex-1">
            Skip
          </Button>
        </div>
      </div>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>No Extras Selected</AlertDialogTitle>
            <AlertDialogDescription>
              Please select at least one extra or click Skip to continue without any extras.
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
