// Shared RPC type definition for bun↔renderer communication
export type AppRPCType = {
  bun: {
    requests: {
      'detect-python': { params: null; response: { detected: boolean; path: string | null } }
      'ensure-uv': { params: null; response: { success: boolean; error?: string } }
      'install-skills': { params: string[]; response: { success: boolean; error?: string } }
      'resize-window': { params: { size: 'wizard' | 'dashboard' }; response: null }
      'close-window': { params: null; response: null }
      'check-installation': { params: null; response: { installed: boolean } }
      'complete-installation': {
        params: { extras: string[]; aiTools: string[] }
        response: { success: boolean; error?: string }
      }
      'detect-ai-tools': {
        params: null
        response: Array<{ key: string; name: string; detected: boolean; configHint: string }>
      }
    }
    messages: Record<string, never>
  }
  webview: {
    requests: Record<string, never>
    messages: Record<string, never>
  }
}
