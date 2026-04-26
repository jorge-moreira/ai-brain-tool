import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'

describe('list command integration', () => {
  let tmpHome
  let originalHome

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-list-test-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome
    
    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({ brains: {} }),
      'utf8'
    )
  })

  afterEach(() => {
    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show empty list when no brains configured', () => {
    const output = execSync(
      `node ${join(process.cwd(), 'bin', 'ai-brain.js')} list`,
      { encoding: 'utf8', env: { ...process.env, __HOME__: tmpHome } }
    )
    
    expect(output).toContain('No brains configured')
  })

  it('should list configured brains', () => {
    const brain1Path = join(tmpHome, 'brain1')
    const brain2Path = join(tmpHome, 'brain2')
    mkdirSync(brain1Path, { recursive: true })
    mkdirSync(brain2Path, { recursive: true })
    
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({
        brains: {
          work: brain1Path,
          personal: brain2Path
        }
      }),
      'utf8'
    )
    
    const output = execSync(
      `node ${join(process.cwd(), 'bin', 'ai-brain.js')} list`,
      { encoding: 'utf8', env: { ...process.env, __HOME__: tmpHome } }
    )
    
    expect(output).toContain('work')
    expect(output).toContain('personal')
    expect(output).toContain(brain1Path)
    expect(output).toContain(brain2Path)
  })

  it('should show brain with local indicator when in brain folder', () => {
    const brainPath = join(tmpHome, 'mybrain')
    mkdirSync(brainPath, { recursive: true })
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ id: 'mybrain' }),
      'utf8'
    )
    
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({
        brains: {
          mybrain: brainPath
        }
      }),
      'utf8'
    )
    
    const output = execSync(
      `node ${join(process.cwd(), 'bin', 'ai-brain.js')} list`,
      { encoding: 'utf8', cwd: brainPath, env: { ...process.env, __HOME__: tmpHome } }
    )
    
    expect(output).toContain('mybrain')
  })
})
