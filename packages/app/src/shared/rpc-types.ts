// Shared RPC type definition for bun↔renderer communication
import type { UpdateResult } from '@ai-brain/core/update'

export interface BrainInfo {
  id: string
  name: string
  path: string
  sizeBytes: number
  notesCount: number
  syncEnabled: boolean
  obsidianConfigured: boolean
  lastSync?: string
  icon?: string
  iconColor?: string
}

export type AppRPCType = {
  bun: {
    requests: {
      'detect-python': { params: null; response: { detected: boolean; path: string | null } }
      'ensure-uv': { params: null; response: { success: boolean; error?: string } }
      'install-skills': { params: string[]; response: { success: boolean; error?: string } }
      'resize-window': { params: { size: 'wizard' | 'dashboard' }; response: null }
      'close-window': { params: null; response: null }
      'check-installation': { params: null; response: { installed: boolean } }
      'start-global-venv': { params: { extras: string[] }; response: { jobId: string } }
      'get-venv-status': {
        params: { jobId: string }
        response: { status: 'running' | 'done' | 'error'; progress?: number; error?: string }
      }
      'save-extras': {
        params: { extras: string[] }
        response: { success: boolean; error?: string }
      }
      'save-ai-tools': {
        params: { aiTools: string[] }
        response: { success: boolean; error?: string }
      }
      'detect-ai-tools': {
        params: null
        response: Array<{ key: string; name: string; detected: boolean; configHint: string }>
      }
      // Dashboard / Brain management
      'list-brains': { params: null; response: BrainInfo[] }
      'create-brain': {
        params: {
          name: string
          path: string
          useGit: boolean
          gitRemote?: string
          gitSync: boolean
          configureObsidian: boolean
          obsidianDir: string | null
          openInObsidian?: boolean
        }
        response: { success: boolean; error?: string }
      }
      'import-brain': {
        params: { path: string }
        response: { success: boolean; brainId?: string; error?: string }
      }
      'delete-brain': {
        params: { brainId: string; deleteFolder?: boolean }
        response: { success: boolean; error?: string }
      }
      'toggle-sync': {
        params: { brainId: string; enabled: boolean }
        response: { success: boolean; error?: string }
      }
      'save-brain-appearance': {
        params: { brainId: string; icon: string; iconColor: string }
        response: { success: boolean; error?: string }
      }
      'clear-cache': { params: { brainId: string }; response: { success: boolean; error?: string } }
      'get-brain-size': {
        params: { brainId: string }
        response: { sizeBytes: number; notesCount: number }
      }
      'open-brain-folder': {
        params: { brainId: string }
        response: { success: boolean; error?: string }
      }
      'open-brain-obsidian': {
        params: { brainId: string }
        response: { success: boolean; error?: string }
      }
      'sync-brain': {
        params: { brainId: string }
        response: UpdateResult
      }
      'select-folder': {
        params: null
        response: { success: boolean; path?: string; error?: string }
      }
      'get-preferences': {
        params: null
        response: { theme: 'system' | 'dark' | 'light'; installedAiTools: string[] }
      }
      'save-preferences': {
        params: { theme?: 'system' | 'dark' | 'light'; installedAiTools?: string[] }
        response: { success: boolean; error?: string }
      }
    }
    messages: Record<string, never>
  }
  webview: {
    requests: Record<string, never>
    messages: Record<string, never>
  }
}
