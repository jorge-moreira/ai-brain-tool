import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export interface BrainHandle {
  brainPath: string
  tmpHome: string
  cleanup: () => void
}

export function createBrainWithConfig(name: string, config?: Record<string, unknown>): BrainHandle {
  const tmpHome = mkdtempSync(join(tmpdir(), `ai-brain-${name}-`))
  const brainPath = join(tmpHome, 'brain')
  mkdirSync(brainPath, { recursive: true })
  if (config) {
    writeFileSync(join(brainPath, '.brain-config.json'), JSON.stringify(config), 'utf8')
  }
  return {
    brainPath,
    tmpHome,
    cleanup: () => rmSync(tmpHome, { recursive: true, force: true })
  }
}

export function cleanupBrain(brain: BrainHandle): void {
  brain.cleanup()
}
