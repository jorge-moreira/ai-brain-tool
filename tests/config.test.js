import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('config', () => {
  let tmpHome

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-test-'))
    process.env.__HOME__ = tmpHome
  })

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true })
    delete process.env.__HOME__
  })

  it('should return a path inside the configured home directory', async () => {
    const { configPath } = await import('../src/config.js')
    expect(configPath().startsWith(tmpHome)).toBe(true)
  })

  it('should return null when no config file exists', async () => {
    const { readConfig } = await import('../src/config.js')
    expect(readConfig()).toBe(null)
  })

  it('should create a config file when writeConfig is called', async () => {
    const { writeConfig, configPath } = await import('../src/config.js')
    writeConfig({ brainPath: '/tmp/my-brain' })
    expect(existsSync(configPath())).toBe(true)
  })

  it('should return brainPath after writeConfig is called', async () => {
    const { writeConfig, readConfig } = await import('../src/config.js')
    writeConfig({ brainPath: '/tmp/my-brain' })
    expect(readConfig().brainPath).toBe('/tmp/my-brain')
  })
})