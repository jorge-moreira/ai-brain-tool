import { BrowserWindow, BrowserView, Updater, Screen } from 'electrobun/bun'
import { detectPython, ensureUv } from '@ai-brain/core/graphify'
import { detectAll, configureSelected } from '@ai-brain/core/platforms'
import { homedir } from 'os'
import type { AppRPCType } from '../shared/rpc-types'

const DEV_SERVER_PORT = 5173
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`
const homeDir = homedir()

// Window sizes - smaller for wizard
const WIZARD_SIZE = { width: 600, height: 650 }
const DASHBOARD_SIZE = { width: 1200, height: 800 }

let mainWindow: BrowserWindow | null = null

// Job tracking for long-running operations
const venvJobs = new Map<
  string,
  { status: 'running' | 'done' | 'error'; progress: number; error?: string }
>()

// Helper function to center the window on screen
function centerWindow(window: BrowserWindow, size: { width: number; height: number }) {
  const mainScreen = Screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = mainScreen.bounds
  const x = Math.floor((screenWidth - size.width) / 2)
  const y = Math.floor((screenHeight - size.height) / 2)
  window.setPosition(x, y)
}

// Create RPC instance with bun-side handlers
const appRPC = BrowserView.defineRPC<AppRPCType>({
  handlers: {
    requests: {
      'detect-python': async () => {
        const pythonPath = await detectPython()
        return { detected: pythonPath !== null, path: pythonPath }
      },
      'ensure-uv': async () => {
        try {
          await ensureUv()
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      'start-global-venv': async ({ extras }) => {
        const jobId = `venv-${Date.now()}`
        venvJobs.set(jobId, { status: 'running', progress: 0 })

        // Run in background
        ;(async () => {
          try {
            const { createGlobalVenv } = await import('@ai-brain/core/graphify')
            venvJobs.set(jobId, { status: 'running', progress: 30 })
            await createGlobalVenv(extras)
            venvJobs.set(jobId, { status: 'done', progress: 100 })
          } catch (error) {
            venvJobs.set(jobId, {
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })()

        return { jobId }
      },
      'get-venv-status': async ({ jobId }) => {
        const job = venvJobs.get(jobId)
        if (!job) {
          return { status: 'error' as const, error: 'Job not found' }
        }
        return { status: job.status, progress: job.progress, error: job.error }
      },
      'save-extras': async ({ extras }) => {
        try {
          const { updateConfig } = await import('@ai-brain/core/config')
          updateConfig(config => {
            config.graphifyyExtras = extras
          })
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      'save-ai-tools': async ({ aiTools }) => {
        try {
          const { updateConfig } = await import('@ai-brain/core/config')
          updateConfig(config => {
            config.aiTools = aiTools
            config.installationComplete = true
          })
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      'detect-ai-tools': async () => {
        try {
          const platforms = await detectAll(homeDir)
          return platforms.map(p => ({
            key: p.key,
            name: p.name,
            detected: p.detected,
            configHint: p.configHint
          }))
        } catch (error) {
          console.error('Error detecting AI tools:', error)
          return []
        }
      },
      'install-skills': async (selectedTools: string[]) => {
        try {
          const platforms = await detectAll(homeDir)
          const selected = platforms.filter(p => selectedTools.includes(p.key))
          await configureSelected({ selected, brainPath: homeDir, homeDir })
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      'resize-window': async ({ size }) => {
        const targetSize = size === 'wizard' ? WIZARD_SIZE : DASHBOARD_SIZE
        if (mainWindow) {
          mainWindow.setSize(targetSize.width, targetSize.height)
          centerWindow(mainWindow, targetSize)
        }
        return null
      },
      'close-window': async () => {
        if (mainWindow) {
          mainWindow.close()
        }
        return null
      },
      'check-installation': async () => {
        try {
          const { isInstallationComplete } = await import('@ai-brain/core/config')
          const { globalVenvExists } = await import('@ai-brain/core/graphify')
          const { execSync } = await import('child_process')

          // Check uv
          try {
            execSync('uv --version', { stdio: 'ignore' })
          } catch {
            return { installed: false }
          }

          // Check config flag and venv
          const configOk = isInstallationComplete()
          const venvOk = globalVenvExists()

          return { installed: configOk && venvOk }
        } catch {
          return { installed: false }
        }
      }
    }
  }
})

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel()
  if (channel === 'dev') {
    try {
      await fetch(DEV_SERVER_URL, { method: 'HEAD' })
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`)
      return DEV_SERVER_URL
    } catch {
      console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.")
    }
  }
  return 'views://mainview/index.html'
}

// Check if installation is complete to determine initial window size
async function isInstallationComplete(): Promise<boolean> {
  try {
    const { isInstallationComplete: checkInstall } = await import('@ai-brain/core/config')
    return checkInstall()
  } catch {
    return false
  }
}

// Create the main application window with RPC
const url = await getMainViewUrl()
const installationComplete = await isInstallationComplete()
const initialSize = installationComplete ? DASHBOARD_SIZE : WIZARD_SIZE

mainWindow = new BrowserWindow({
  title: 'AI Brain Tool',
  url,
  frame: {
    x: Math.floor((Screen.getPrimaryDisplay().bounds.width - initialSize.width) / 2),
    y: Math.floor((Screen.getPrimaryDisplay().bounds.height - initialSize.height) / 2),
    width: initialSize.width,
    height: initialSize.height
  },
  rpc: appRPC
})

console.log('AI Brain Tool (ElectroBun) started!')
