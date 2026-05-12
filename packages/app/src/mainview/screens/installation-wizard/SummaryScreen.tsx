import { Button } from '@ai-brain/ui/components/button'
import { useState } from 'react'
import { rpc } from '@/lib/rpc'
import { Icons } from '@ai-brain/ui/components/icons'

interface SummaryScreenProps {
  selectedExtras: string[]
  selectedTools: string[]
  onClose: () => void
  onLaunch: () => void
}

export function SummaryScreen({
  selectedExtras,
  selectedTools,
  onClose,
  onLaunch
}: SummaryScreenProps) {
  const [showExtrasTooltip, setShowExtrasTooltip] = useState(false)
  const [showToolsTooltip, setShowToolsTooltip] = useState(false)

  const handleLaunch = async () => {
    await rpc.resizeWindow('dashboard')
    onLaunch()
  }

  const handleClose = async () => {
    await rpc.closeWindow()
  }

  const getExtrasLabels = (extras: string[]) => {
    const labels: Record<string, string> = {
      video: 'Video Support',
      office: 'Office Support'
    }
    return extras.map(e => labels[e] || e)
  }

  return (
    <div className="wizard-card">
      <div className="card-header">
        <div className="logo-container">
          <Icons.check className="w-10 h-10 text-secondary" />
        </div>
        <h2 className="card-title">Setup Complete</h2>
        <p className="card-description">Ready to launch your AI brain</p>
      </div>

      <div className="card-content">
        <p className="text-muted-foreground mb-4">Installed:</p>
        <ul className="summary-list">
          <li className="summary-item">
            <Icons.check className="w-5 h-5 text-secondary summary-check" />
            <div className="summary-content">
              <div className="summary-title">
                Graphify Installed
                <span
                  className="tooltip-container"
                  onMouseEnter={() => setShowExtrasTooltip(true)}
                  onMouseLeave={() => setShowExtrasTooltip(false)}
                >
                  <Icons.helpCircle className="w-4 h-4 text-muted-foreground ml-2 cursor-help inline" />
                  {showExtrasTooltip && (
                    <div className="tooltip">
                      <div className="tooltip-title">Selected Extras</div>
                      <ul className="tooltip-list">
                        {selectedExtras.length > 0 ? (
                          getExtrasLabels(selectedExtras).map(extra => (
                            <li key={extra} className="tooltip-item">
                              {extra}
                            </li>
                          ))
                        ) : (
                          <li className="tooltip-item">None</li>
                        )}
                      </ul>
                    </div>
                  )}
                </span>
              </div>
              <div className="summary-details">Knowledge graph setup complete</div>
            </div>
          </li>
          <li className="summary-item">
            {selectedTools.length > 0 ? (
              <Icons.check className="w-5 h-5 text-secondary summary-check" />
            ) : (
              <Icons.xCircle className="w-5 h-5 text-muted-foreground summary-skip" />
            )}
            <div className="summary-content">
              <div className="summary-title">
                {selectedTools.length > 0 ? 'AI Tools Setup' : 'AI Tools Skipped'}
                {selectedTools.length > 0 && (
                  <span
                    className="tooltip-container"
                    onMouseEnter={() => setShowToolsTooltip(true)}
                    onMouseLeave={() => setShowToolsTooltip(false)}
                  >
                    <Icons.helpCircle className="w-4 h-4 text-muted-foreground ml-2 cursor-help inline" />
                    {showToolsTooltip && (
                      <div className="tooltip">
                        <div className="tooltip-title">Brain Skills Installed For</div>
                        <ul className="tooltip-list">
                          {selectedTools.map(tool => (
                            <li key={tool} className="tooltip-item">
                              {tool}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </span>
                )}
              </div>
              <div className="summary-details">
                {selectedTools.length > 0
                  ? `${selectedTools.length} brain skill${selectedTools.length > 1 ? 's' : ''} installed`
                  : 'No AI tools configured'}
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div className="button-row">
        <Button onClick={handleClose} variant="outline" className="flex-1">
          Close
        </Button>
        <Button onClick={handleLaunch} className="btn-primary flex-1">
          Launch App
        </Button>
      </div>
    </div>
  )
}
