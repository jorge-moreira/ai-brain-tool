import { Button } from '@ai-brain/ui/components/button';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="wizard-card">
      <div className="card-header">
        <div className="logo-container">
          <img src="/logo.svg" alt="AI Brain" className="logo" />
        </div>
        <h2 className="card-title">Welcome to AI Brain</h2>
        <p className="card-description">Set up your local AI brain in minutes</p>
      </div>
      
      <div className="card-content">
        <p className="text-muted-foreground mb-4">This wizard will help you:</p>
        <ul className="feature-list">
          <li className="feature-item">
            <span className="feature-dot"></span>
            Install UV package manager
          </li>
          <li className="feature-item">
            <span className="feature-dot"></span>
            Install Graphify with extras
          </li>
          <li className="feature-item">
            <span className="feature-dot"></span>
            Configure your AI tools
          </li>
        </ul>
      </div>
      
      <Button onClick={onNext} className="btn-primary w-full">
        Get Started
      </Button>
    </div>
  );
}
