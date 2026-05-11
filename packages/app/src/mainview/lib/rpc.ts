// RPC client using ElectroBun's Electroview API
import { Electroview } from 'electrobun/view'
import type { AppRPCType } from '@/shared/rpc-types'

const rpcInstance = Electroview.defineRPC<AppRPCType>({
  maxRequestTime: Infinity, // No timeout for user-driven operations like file dialogs
  handlers: {
    requests: {
      // Browser-side handlers (if needed)
    },
    messages: {
      // Browser-side message handlers (if needed)
    }
  }
})

export const electroview = new Electroview({ rpc: rpcInstance })

// Type helper: Extract response type from a request method
type ResponseOf<T> = T extends { response: infer R } ? R : never

// Typed proxy for bun-side requests — mirrors RPCRequestsProxy from electrobun
type BunRequests = AppRPCType['bun']['requests']
type TypedRequestProxy = {
  [K in keyof BunRequests]: (
    params: BunRequests[K]['params']
  ) => Promise<BunRequests[K]['response']>
}

// Single cast at the boundary; all subsequent accesses are fully typed
const proxy = rpcInstance.requestProxy as unknown as TypedRequestProxy

// Convenience wrapper for bun-side RPC calls
export const rpc = {
  async detectPython(): Promise<ResponseOf<AppRPCType['bun']['requests']['detect-python']>> {
    return proxy['detect-python'](null)
  },

  async ensureUv(): Promise<ResponseOf<AppRPCType['bun']['requests']['ensure-uv']>> {
    return proxy['ensure-uv'](null)
  },

  async startGlobalVenv(
    extras: string[]
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['start-global-venv']>> {
    return proxy['start-global-venv']({ extras })
  },

  async getVenvStatus(
    jobId: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['get-venv-status']>> {
    return proxy['get-venv-status']({ jobId })
  },

  async detectAiTools(): Promise<ResponseOf<AppRPCType['bun']['requests']['detect-ai-tools']>> {
    return proxy['detect-ai-tools'](null)
  },

  async installSkills(
    selectedTools: string[]
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['install-skills']>> {
    return proxy['install-skills'](selectedTools)
  },

  async resizeWindow(
    size: 'wizard' | 'dashboard'
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['resize-window']>> {
    return proxy['resize-window']({ size })
  },

  async checkInstallation(): Promise<
    ResponseOf<AppRPCType['bun']['requests']['check-installation']>
  > {
    return proxy['check-installation'](null)
  },

  async saveExtras(
    extras: string[]
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['save-extras']>> {
    return proxy['save-extras']({ extras })
  },

  async saveAiTools(
    aiTools: string[]
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['save-ai-tools']>> {
    return proxy['save-ai-tools']({ aiTools })
  },

  async closeWindow(): Promise<ResponseOf<AppRPCType['bun']['requests']['close-window']>> {
    return proxy['close-window'](null)
  },

  // Dashboard / Brain management
  async listBrains(): Promise<ResponseOf<AppRPCType['bun']['requests']['list-brains']>> {
    return proxy['list-brains'](null)
  },

  async createBrain(
    params: AppRPCType['bun']['requests']['create-brain']['params']
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['create-brain']>> {
    return proxy['create-brain'](params)
  },

  async importBrain(
    path: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['import-brain']>> {
    return proxy['import-brain']({ path })
  },

  async deleteBrain(
    brainId: string,
    deleteFolder = false
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['delete-brain']>> {
    return proxy['delete-brain']({ brainId, deleteFolder })
  },

  async toggleSync(
    brainId: string,
    enabled: boolean
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['toggle-sync']>> {
    return proxy['toggle-sync']({ brainId, enabled })
  },

  async clearCache(
    brainId: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['clear-cache']>> {
    return proxy['clear-cache']({ brainId })
  },

  async getBrainSize(
    brainId: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['get-brain-size']>> {
    return proxy['get-brain-size']({ brainId })
  },

  async openBrainFolder(
    brainId: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['open-brain-folder']>> {
    return proxy['open-brain-folder']({ brainId })
  },

  async openBrainObsidian(
    brainId: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['open-brain-obsidian']>> {
    return proxy['open-brain-obsidian']({ brainId })
  },

  async selectFolder(): Promise<ResponseOf<AppRPCType['bun']['requests']['select-folder']>> {
    return proxy['select-folder'](null)
  },

  async saveBrainAppearance(
    brainId: string,
    icon: string,
    iconColor: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['save-brain-appearance']>> {
    return proxy['save-brain-appearance']({ brainId, icon, iconColor })
  },

  async syncBrain(
    brainId: string
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['sync-brain']>> {
    return proxy['sync-brain']({ brainId })
  },

  async getPreferences(): Promise<ResponseOf<AppRPCType['bun']['requests']['get-preferences']>> {
    return proxy['get-preferences'](null)
  },

  async savePreferences(
    params: AppRPCType['bun']['requests']['save-preferences']['params']
  ): Promise<ResponseOf<AppRPCType['bun']['requests']['save-preferences']>> {
    return proxy['save-preferences'](params)
  }
}
