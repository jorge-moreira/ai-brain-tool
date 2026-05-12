import React from 'react'
import ReactDOM from 'react-dom/client'
import { TooltipProvider } from '@ai-brain/ui/components/tooltip'
import { Toaster } from '@ai-brain/ui/components/sonner'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
      <Toaster />
    </TooltipProvider>
  </React.StrictMode>
)
