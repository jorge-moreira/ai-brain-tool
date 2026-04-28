import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { autoUpdater } from 'electron-updater'
import * as brainStatus from '@ai-brain/core/commands/status'
import * as brainUpdate from '@ai-brain/core/commands/update'
import * as brainSetup from '@ai-brain/core/commands/setup'
import * as brainList from '@ai-brain/core/commands/list'
import { getConfig, setConfig } from '@ai-brain/core/config'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.checkForUpdatesAndNotify()

  // Auto-updater event listeners
  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-available')
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', err => {
    mainWindow?.webContents.send('update-error', err)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('brain:status', async (_event, brainId?: string) => {
  try {
    const result = await brainStatus.status(brainId)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('brain:update', async (_event, brainId?: string) => {
  try {
    await brainUpdate.update(brainId)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('brain:setup', async () => {
  try {
    const result = await brainSetup.setup()
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('brain:list', async () => {
  try {
    const result = await brainList.list()
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('config:get', async () => {
  try {
    const result = await getConfig()
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('config:set', async (_event, config: any) => {
  try {
    if (!config || typeof config !== 'object') {
      return { success: false, error: 'Invalid config object' }
    }
    await setConfig(config)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('app:quit', () => {
  app.quit()
})

ipcMain.handle('app:check-updates', () => {
  return autoUpdater.checkForUpdatesAndNotify()
})
