import Electrobun, {
  BrowserWindow,
  BrowserView,
  Updater,
  Screen,
  Utils,
  ApplicationMenu,
  type ApplicationMenuItemConfig
} from 'electrobun/bun'
import { detectPython, ensureUv, createGlobalVenv, globalVenvExists } from '@ai-brain/core/graphify'
import { createBrain, importBrain, removeBrain } from '@ai-brain/core/brains'
import { readBrainConfig, resolveBrain } from '@ai-brain/core/config/brains'
import {
  readConfig,
  updateConfig,
  isInstallationComplete,
  toggleSyncById,
  getBrainSize,
  countNotes,
  clearGraphifyCacheById,
  getBrainSizeById,
  countNotesById,
  detectAll,
  installSkills
} from '@ai-brain/core'
import { updateBrainById } from '@ai-brain/core/update'
import { homedir } from 'os'
import { exec, execSync } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import type { AppRPCType, BrainInfo } from '../shared/rpc-types'

const execAsync = promisify(exec)

function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return join(homedir(), filePath.slice(1))
  }
  return filePath
}

const DEV_SERVER_PORT = 5173
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`
const homeDir = homedir()

const PREFS_PATH = join(homeDir, '.ai-brain-tool', 'preferences.json')

interface BrainAppearance {
  icon: string
  iconColor: string
}

interface Preferences {
  brainAppearance: Record<string, BrainAppearance>
  theme?: 'system' | 'dark' | 'light'
}

function readPreferences(): Preferences {
  try {
    const raw = readFileSync(PREFS_PATH, 'utf-8')
    return JSON.parse(raw) as Preferences
  } catch {
    return { brainAppearance: {}, theme: 'system' }
  }
}

function writePreferences(prefs: Preferences): void {
  const dir = join(homeDir, '.ai-brain-tool')
  mkdirSync(dir, { recursive: true })
  writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2), 'utf-8')
}

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
          await installSkills({ selected, homeDir })
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      'get-preferences': async () => {
        try {
          const prefs = readPreferences()
          const config = readConfig()
          return {
            theme: prefs.theme || 'system',
            installedAiTools: config.aiTools || []
          }
        } catch (error) {
          console.error('Error reading preferences:', error)
          return { theme: 'system' as const, installedAiTools: [] }
        }
      },
      'save-preferences': async ({ theme, installedAiTools }) => {
        try {
          const prefs = readPreferences()
          if (theme) {
            prefs.theme = theme
          }
          writePreferences(prefs)

          if (installedAiTools) {
            updateConfig(config => {
              config.aiTools = installedAiTools
              config.installationComplete = true
            })
          }

          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      // Dashboard / Brain management
      'list-brains': async () => {
        try {
          const config = readConfig()
          const prefs = readPreferences()
          const brains: BrainInfo[] = []

          for (const [brainId, rawBrainPath] of Object.entries(config.brains || {})) {
            try {
              const sizeBytes = getBrainSize(rawBrainPath)
              const notesCount = countNotes(rawBrainPath)
              const brainConfig = readBrainConfig(rawBrainPath)
              const obsidianConfigured = !!brainConfig.obsidianDir
              const appearance = prefs.brainAppearance?.[brainId]

              brains.push({
                id: brainId,
                name: brainId,
                path: rawBrainPath,
                sizeBytes,
                notesCount,
                syncEnabled: brainConfig.gitSync || false,
                obsidianConfigured,
                icon: appearance?.icon,
                iconColor: appearance?.iconColor
              })
            } catch (err) {
              console.error(`Error reading brain ${brainId}:`, err)
            }
          }

          return brains
        } catch (error) {
          console.error('Error listing brains:', error)
          return []
        }
      },
      'create-brain': async ({
        name,
        path,
        useGit,
        gitRemote,
        gitSync,
        configureObsidian,
        obsidianDir,
        openInObsidian
      }) => {
        const result = await createBrain({
          name,
          basePath: path,
          includeObsidian: configureObsidian,
          obsidianDir,
          gitSync,
          useGit,
          gitRemote
        })

        if (result.success && openInObsidian && configureObsidian) {
          const brainPath = result.brainPath || path
          const finalObsidianPath = obsidianDir && obsidianDir !== '' ? obsidianDir : brainPath
          try {
            if (process.platform === 'darwin') {
              await execAsync(`open -a Obsidian "${finalObsidianPath}"`)
            } else if (process.platform === 'win32') {
              await execAsync(
                `start obsidian://open?vault=${encodeURIComponent(finalObsidianPath)}`
              )
            } else {
              await execAsync(`obsidian://open?vault=${encodeURIComponent(finalObsidianPath)}`)
            }
          } catch (err) {
            console.error('[create-brain] Failed to open Obsidian:', err)
          }
        }

        return result
      },
      'import-brain': async ({ path }) => {
        const result = await importBrain(path)
        return result
      },
      'delete-brain': async ({ brainId, deleteFolder = false }) => {
        const result = await removeBrain(brainId, deleteFolder)
        return result
      },
      'toggle-sync': async ({ brainId, enabled }) => {
        toggleSyncById(brainId, enabled)
        return { success: true }
      },
      'save-brain-appearance': async ({ brainId, icon, iconColor }) => {
        try {
          const prefs = readPreferences()
          prefs.brainAppearance = prefs.brainAppearance ?? {}
          prefs.brainAppearance[brainId] = { icon, iconColor }
          writePreferences(prefs)
          return { success: true }
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
        }
      },
      'clear-cache': async ({ brainId }) => {
        clearGraphifyCacheById(brainId)
        return { success: true }
      },
      'get-brain-size': async ({ brainId }) => ({
        sizeBytes: getBrainSizeById(brainId),
        notesCount: countNotesById(brainId)
      }),
      'open-brain-folder': async ({ brainId }) => {
        const { path } = resolveBrain(brainId)
        if (process.platform === 'darwin') await execAsync(`open "${path}"`)
        else if (process.platform === 'win32') await execAsync(`explorer "${path}"`)
        else await execAsync(`xdg-open "${path}"`)
        return { success: true }
      },
      'open-brain-obsidian': async ({ brainId }) => {
        try {
          const { path } = resolveBrain(brainId)
          const brainConfig = readBrainConfig(path)
          const obsidianPath = expandTilde(brainConfig.obsidianDir || path)
          if (process.platform === 'darwin') await execAsync(`open -a Obsidian "${obsidianPath}"`)
          else if (process.platform === 'win32')
            await execAsync(`start obsidian://open?vault=${obsidianPath}`)
          else await execAsync(`obsidian://open?vault=${obsidianPath}`)
          return { success: true }
        } catch (error) {
          console.error('[RPC open-brain-obsidian] Error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to open Obsidian'
          }
        }
      },
      'sync-brain': async ({ brainId }) => updateBrainById(brainId),
      'select-folder': async () => {
        console.log('[RPC select-folder] Starting folder selection...')
        try {
          // Use Electrobun's native openFileDialog API
          console.log('[RPC select-folder] Calling Utils.openFileDialog...')
          const paths = await Utils.openFileDialog({
            startingFolder: homedir(),
            allowedFileTypes: '*',
            canChooseFiles: false,
            canChooseDirectory: true,
            allowsMultipleSelection: false
          })
          console.log('[RPC select-folder] openFileDialog returned:', paths)

          if (paths && paths.length > 0 && paths[0]) {
            console.log('[RPC select-folder] Success:', paths[0])
            return { success: true, path: paths[0] }
          }
          console.log('[RPC select-folder] No path selected')
          return { success: false, error: 'No folder selected' }
        } catch (error) {
          console.error('[RPC select-folder] Error:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to open folder picker'
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

// Create the main application window with RPC
const url = await getMainViewUrl()
const installationComplete = isInstallationComplete()
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

// Set up application menu
const menuTemplate: ApplicationMenuItemConfig[] = [
  {
    label: 'AI Brain Tool',
    submenu: [
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        action: 'navigate-to-settings'
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        action: 'quit'
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        action: 'open-documentation'
      }
    ]
  }
]

ApplicationMenu.setApplicationMenu(menuTemplate)

// Listen for menu item clicks
Electrobun.events.on('application-menu-clicked', (e: unknown) => {
  const event = e as { data?: { action?: string } } | undefined
  console.log('=== MENU CLICKED ===')
  console.log('Event data:', event?.data)
  if (event?.data?.action === 'navigate-to-settings') {
    console.log('Navigating to settings...')
    // Execute JavaScript in all browser views
    const views = BrowserView.getAll()
    console.log('Found views:', views.length)
    for (const view of views) {
      console.log('Executing JS in view:', view.id)
      view.executeJavascript(`
        console.log('=== EXECUTING NAVIGATION ===');
        console.log('window.__navigateTo exists:', typeof window.__navigateTo);
        if (window.__navigateTo) {
          console.log('Calling __navigateTo(settings)');
          window.__navigateTo('settings');
        } else {
          console.log('Dispatching custom event');
          window.dispatchEvent(new CustomEvent('navigate-to', { detail: { view: 'settings' } }));
        }
      `)
    }
  } else if (event?.data?.action === 'quit') {
    mainWindow?.close()
  } else if (event?.data?.action === 'open-documentation') {
    Utils.openExternal('https://github.com/jorge-moreira/ai-brain-tool')
  }
})

console.log('AI Brain Tool (ElectroBun) started!')
