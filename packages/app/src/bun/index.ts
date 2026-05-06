import { BrowserWindow, BrowserView, Updater } from 'electrobun/bun'
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
      },
      'complete-installation': async ({ extras, aiTools }) => {
        try {
          const { setInstallationComplete, addGraphifyyExtra, writeConfig, createInitialConfig } =
            await import('@ai-brain/core/config')

          // Set installation complete
          setInstallationComplete()

          // Add extras
          for (const extra of extras) {
            addGraphifyyExtra(extra)
          }

          // Add AI tools
          const config = createInitialConfig()
          config.installationComplete = true
          config.graphifyyExtras = extras
          config.aiTools = aiTools
          writeConfig(config)

          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
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

// Create the main application window with RPC
const url = await getMainViewUrl()

mainWindow = new BrowserWindow({
  title: 'AI Brain Tool',
  url,
  frame: {
    width: WIZARD_SIZE.width,
    height: WIZARD_SIZE.height
  },
  rpc: appRPC
})

console.log('AI Brain Tool (ElectroBun) started!')
