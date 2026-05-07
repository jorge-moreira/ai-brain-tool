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
      'start-global-venv': { params: { extras: string[] }; response: { jobId: string } }
      'get-venv-status': { params: { jobId: string }; response: { status: 'running' | 'done' | 'error'; progress?: number; error?: string } }
      'save-extras': { params: { extras: string[] }; response: { success: boolean; error?: string } }
      'save-ai-tools': { params: { aiTools: string[] }; response: { success: boolean; error?: string } }
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
