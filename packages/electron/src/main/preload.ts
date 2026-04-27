import { contextBridge, ipcRenderer } from 'electron'

export interface BrainStatus {
  version: string
  graphExists: boolean
  gitSynced: boolean
  mcpConnected: boolean
}

export interface IpcResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Brain commands
  getStatus: (brainId?: string): Promise<IpcResponse<BrainStatus>> => 
    ipcRenderer.invoke('brain:status', brainId),
  update: (brainId?: string): Promise<IpcResponse> => 
    ipcRenderer.invoke('brain:update', brainId),
  setup: (): Promise<IpcResponse> => 
    ipcRenderer.invoke('brain:setup'),
  list: (): Promise<IpcResponse> => 
    ipcRenderer.invoke('brain:list'),
  
  // Config
  getConfig: (): Promise<IpcResponse> => 
    ipcRenderer.invoke('config:get'),
  setConfig: (config: any): Promise<IpcResponse> => 
    ipcRenderer.invoke('config:set', config),
  
  // App
  quit: (): Promise<void> => 
    ipcRenderer.invoke('app:quit'),
  checkUpdates: (): Promise<void> => 
    ipcRenderer.invoke('app:check-updates'),
  
  // Platform
  platform: process.platform,
  
  // Update events
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback)
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback)
  },
  onUpdateError: (callback: (event: any, error: any) => void) => {
    ipcRenderer.on('update-error', callback)
  },
})
