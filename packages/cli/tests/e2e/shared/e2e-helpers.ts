import { execa } from 'execa'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'

export interface E2EContext {
  tempDir: string
  brainPath: string
  lastOutput: string
  lastExitCode: number | undefined
}

export function createE2EContext(): E2EContext {
  return {
    tempDir: '',
    brainPath: '',
    lastOutput: '',
    lastExitCode: undefined
  }
}

export async function setupBrain(context: E2EContext, name: string): Promise<void> {
  const timestamp = Date.now()
  context.tempDir = join(tmpdir(), `ai-brain-e2e-${timestamp}`)
  context.brainPath = join(context.tempDir, name)
  const configDir = join(context.tempDir, '.ai-brain-tool')

  mkdirSync(configDir, { recursive: true })
  mkdirSync(join(context.brainPath, 'raw', 'notes'), { recursive: true })

  const config = { brains: { [name]: context.brainPath } }
  writeFileSync(join(configDir, 'config.json'), JSON.stringify(config, null, 2))
  writeFileSync(
    join(context.brainPath, '.brain-config.json'),
    JSON.stringify({ gitSync: false, extras: [], obsidianDir: null }, null, 2)
  )
}

export async function runCommand(
  context: E2EContext,
  cmd: string,
  args: string[] = []
): Promise<void> {
  const cliPath = join(process.cwd(), 'src/index.ts')
  try {
    const result = await execa('bun', [cliPath, cmd, ...args], {
      env: { ...process.env, __HOME__: context.tempDir },
      reject: false,
      all: true
    })
    context.lastOutput = result.all || result.stdout
    context.lastExitCode = result.exitCode
  } catch (error) {
    const err = error as Error & { exitCode?: number }
    context.lastOutput = err.message
    context.lastExitCode = err.exitCode ?? undefined
  }
}

export function cleanupContext(context: E2EContext): void {
  if (context.tempDir && existsSync(context.tempDir)) {
    rmSync(context.tempDir, { recursive: true, force: true })
  }
}
