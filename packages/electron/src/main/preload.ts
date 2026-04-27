import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Brain commands
  getStatus: (brainId?: string) => ipcRenderer.invoke('brain:status', brainId),
  update: (brainId?: string) => ipcRenderer.invoke('brain:update', brainId),
  setup: () => ipcRenderer.invoke('brain:setup'),
  list: () => ipcRenderer.invoke('brain:list'),
  
  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: any) => ipcRenderer.invoke('config:set', config),
  
  // App
  quit: () => ipcRenderer.invoke('app:quit'),
  checkUpdates: () => ipcRenderer.invoke('app:check-updates'),
  
  // Platform
  platform: process.platform,
})
