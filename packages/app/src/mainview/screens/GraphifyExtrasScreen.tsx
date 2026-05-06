import { Button } from '@ai-brain/ui/components/button';
import { Checkbox } from '@ai-brain/ui/components/checkbox';
import { Label } from '@ai-brain/ui/components/label';
import { Globe } from 'lucide-react';

interface GraphifyExtrasScreenProps {
  selectedExtras: string[];
  onSelectExtras: (extras: string[]) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export function GraphifyExtrasScreen({ selectedExtras, onSelectExtras, onContinue, onSkip }: GraphifyExtrasScreenProps) {
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

  return (
    <div className="wizard-card">
      <div className="card-header">
        <div className="logo-container">
          <Globe className="w-10 h-10 text-primary" />
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
              onClick={() => toggleExtra(extra.id)}
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
        <Button onClick={onContinue} className="btn-primary flex-1">
          Continue
        </Button>
        <Button onClick={onSkip} variant="outline" className="flex-1">
          Skip
        </Button>
      </div>
    </div>
  );
}
