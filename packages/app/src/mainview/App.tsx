import { useState, useEffect } from 'react'
import { Wizard } from '@/views/Wizard'
import { Dashboard } from '@/views/Dashboard'
import { Settings } from '@/views/Settings'
import { rpc } from '@/lib/rpc'

type View = 'dashboard' | 'settings'

function App() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null)
  const [forceDashboard, setForceDashboard] = useState(false)
  const [currentView, setCurrentView] = useState<View>('dashboard')

  useEffect(() => {
    // Check if global installation was done (uv + AI tools configured)
    rpc
      .checkInstallation()
      .then(result => {
        setIsInstalled(result.installed)
      })
      .catch(error => {
        console.error('App: Failed to check installation:', error)
        setIsInstalled(false)
      })

    // Keyboard shortcut: Press 'D' to force dashboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setForceDashboard(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    console.log('App: Setting up navigate-to listener')

    // Set up global function for menu navigation
    ;(window as any).__navigateTo = (view: 'dashboard' | 'settings') => {
      console.log('App: Called __navigateTo with', view)
      setCurrentView(view)
    }

    // Listen for navigate-to messages from main process
    const handler = (event: any) => {
      console.log('App: Received navigate-to event', event)
      const data = event.detail || event.args?.[0]
      if (data?.view) {
        console.log('App: Navigating to', data.view)
        setCurrentView(data.view)
      }
    }

    // Listen for custom events
    window.addEventListener('navigate-to', handler as any)

    return () => {
      window.removeEventListener('navigate-to', handler as any)
    }
  }, [])

  const handleWizardComplete = () => {
    setIsInstalled(true)
  }

  if (isInstalled === null && !forceDashboard) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {currentView === 'settings' ? (
        <Settings />
      ) : forceDashboard || isInstalled ? (
        <Dashboard onWizardComplete={handleWizardComplete} />
      ) : (
        <Wizard onComplete={handleWizardComplete} />
      )}
    </>
  )
}

export default App
