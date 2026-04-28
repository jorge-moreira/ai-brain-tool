/// <reference types="vite/client" />

import { type IpcResponse, type BrainStatus } from '../../main/preload'

interface Window {
  electronAPI: {
    getStatus: (brainId?: string) => Promise<IpcResponse<BrainStatus>>
    update: (brainId?: string) => Promise<IpcResponse>
    setup: () => Promise<IpcResponse>
    list: () => Promise<IpcResponse>
    getConfig: () => Promise<IpcResponse>
    setConfig: (config: any) => Promise<IpcResponse>
    quit: () => Promise<void>
    checkUpdates: () => Promise<void>
    platform: string
    onUpdateAvailable: (callback: () => void) => void
    onUpdateDownloaded: (callback: () => void) => void
    onUpdateError: (callback: (event: any, error: any) => void) => void
  }
}
