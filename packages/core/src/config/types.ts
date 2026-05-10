export interface BrainConfig {
  gitSync: boolean
  obsidianDir?: string | null
}

export interface Config {
  installationComplete: boolean
  graphifyyExtras: string[]
  aiTools: string[]
  brains: Record<string, string>
}

export interface ResolvedBrain {
  id: string
  path: string
  isLocal: boolean
}

export interface BrainInfo {
  id: string
  path: string
}

export interface GetBrainPathOptions {
  brainId?: string
}
