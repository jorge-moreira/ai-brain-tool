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
    },
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
  return brainStatus.status(brainId)
})

ipcMain.handle('brain:update', async (_event, brainId?: string) => {
  return brainUpdate.update(brainId)
})

ipcMain.handle('brain:setup', async () => {
  return brainSetup.setup()
})

ipcMain.handle('brain:list', async () => {
  return brainList.list()
})

ipcMain.handle('config:get', async () => {
  return getConfig()
})

ipcMain.handle('config:set', async (_event, config: any) => {
  return setConfig(config)
})

ipcMain.handle('app:quit', () => {
  app.quit()
})

ipcMain.handle('app:check-updates', () => {
  return autoUpdater.checkForUpdatesAndNotify()
})
