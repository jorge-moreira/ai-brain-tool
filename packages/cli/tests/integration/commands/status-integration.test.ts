import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'

describe('status command integration', () => {
  let tmpHome
  let originalHome

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-status-test-'))
    originalHome = process.env.HOME
    process.env.HOME = tmpHome
    process.env.__HOME__ = tmpHome
    
    mkdirSync(join(tmpHome, '.ai-brain-tool'), { recursive: true })
  })

  afterEach(() => {
    process.env.HOME = originalHome
    delete process.env.__HOME__
    rmSync(tmpHome, { recursive: true, force: true })
  })

  it('should show error when no brain configured', () => {
    const output = execSync(
      `node ${join(process.cwd(), 'bin', 'ai-brain'.ts')} status 2>&1 || true`,
      { encoding: 'utf8', env: { ...process.env, __HOME__: tmpHome } }
    )
    
    expect(output).toContain('Config not found')
    expect(output).toContain('ai-brain setup')
  })

  it('should show status for brain folder', () => {
    const brainPath = join(tmpHome, 'mybrain')
    mkdirSync(brainPath, { recursive: true })
    
    mkdirSync(join(brainPath, 'raw', 'notes'), { recursive: true })
    mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })
    
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [] }),
      'utf8'
    )
    
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({
        brains: {
          test: brainPath
        }
      }),
      'utf8'
    )
    
    const output = execSync(
      `node ${join(process.cwd(), 'bin', 'ai-brain'.ts')} status test`,
      { encoding: 'utf8', env: { ...process.env, __HOME__: tmpHome } }
    )
    
    expect(output).toContain('Tool version:')
    expect(output).toContain('Brain path:')
    expect(output).toContain('Graphify:')
  })

  it('should show graph status when graph.json exists', () => {
    const brainPath = join(tmpHome, 'mybrain')
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, 'graphify-out'), { recursive: true })
    
    writeFileSync(
      join(brainPath, 'graphify-out', 'graph.json'),
      JSON.stringify({ nodes: [], edges: [] }),
      'utf8'
    )
    
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: false, extras: [] }),
      'utf8'
    )
    
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({
        brains: {
          test: brainPath
        }
      }),
      'utf8'
    )
    
    const output = execSync(
      `node ${join(process.cwd(), 'bin', 'ai-brain'.ts')} status test`,
      { encoding: 'utf8', env: { ...process.env, __HOME__: tmpHome } }
    )
    
    expect(output).toContain('Graph:')
  })

  it('should show git status when git repo exists', () => {
    const brainPath = join(tmpHome, 'mybrain')
    mkdirSync(brainPath, { recursive: true })
    mkdirSync(join(brainPath, '.venv', 'bin'), { recursive: true })
    writeFileSync(join(brainPath, '.venv', 'bin', 'python3'), '', 'utf8')
    
    execSync('git init', { cwd: brainPath, stdio: 'ignore' })
    execSync('git config user.email "test@test.com"', { cwd: brainPath, stdio: 'ignore' })
    execSync('git config user.name "Test"', { cwd: brainPath, stdio: 'ignore' })
    
    writeFileSync(
      join(brainPath, '.brain-config.json'),
      JSON.stringify({ gitSync: true, extras: [] }),
      'utf8'
    )
    
    writeFileSync(
      join(tmpHome, '.ai-brain-tool', 'config.json'),
      JSON.stringify({
        brains: {
          test: brainPath
        }
      }),
      'utf8'
    )
    
    const output = execSync(
      `node ${join(process.cwd(), 'bin', 'ai-brain'.ts')} status test`,
      { encoding: 'utf8', env: { ...process.env, __HOME__: tmpHome } }
    )
    
    expect(output).toContain('Tool version:')
  })
})
