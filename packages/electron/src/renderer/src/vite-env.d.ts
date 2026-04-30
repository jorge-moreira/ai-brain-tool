/// <reference types="vite/client" />

import { type IpcResponse, type BrainStatus } from '../../main/preload'
import { type DetectedPlatform } from '@ai-brain/core/platforms'

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
    ensureUv: () => Promise<IpcResponse>
    detectPlatforms: () => Promise<IpcResponse<DetectedPlatform[]>>
    installSkills: (selected: string[]) => Promise<IpcResponse>
    setWizardCompleted: (completed: boolean) => Promise<IpcResponse>
    getWizardCompleted: () => Promise<IpcResponse<{ wizardCompleted: boolean }>>
  }
}
