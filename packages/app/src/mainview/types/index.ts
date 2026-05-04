export interface AITool {
  key: string
  name: string
  detected: boolean
  configHint: string
}

export interface PythonStatus {
  detected: boolean
  path: string | null
}
