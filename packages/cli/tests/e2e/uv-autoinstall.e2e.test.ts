import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('E2E: UV auto-install during setup', () => {
  const REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd()
  const TEMP_DIR = join(tmpdir(), `ai-brain-e2e-uv-${Date.now()}`)
  const BRAIN_PATH = join(TEMP_DIR, 'test-brain')
  const GLOBAL_CONFIG_DIR = join(TEMP_DIR, '.ai-brain-tool')

  beforeAll(() => {
    console.log('=== E2E Test: UV auto-install during setup ===')
    console.log(`Temp directory: ${TEMP_DIR}`)
    console.log(`Brain path: ${BRAIN_PATH}`)

    mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true })
  }, 30000)

  afterAll(() => {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true })
      console.log(`\nCleaned up temp directory: ${TEMP_DIR}`)
    } catch {
      console.log(`Warning: Could not clean up ${TEMP_DIR}: ${e.message}`)
    }
  }, 30000)

  it('should install uv automatically if not present', () => {
    console.log('\nStep 1: Checking uv availability...')

    // Run the graphify module's ensureUv function via a test script
    const testScript = join(TEMP_DIR, 'test-uv-install.js')
    writeFileSync(
      testScript,
      `
      import { ensureUv } from '${join(REPO_PATH, '..', 'core', 'src', 'graphify.ts')}'
      
      console.log('Running ensureUv...')
      await ensureUv()
      console.log('ensureUv completed successfully')
      
      // Verify uv is now available
      const { execSync } = await import('child_process')
      try {
        const version = execSync('uv --version', { encoding: 'utf8' })
        console.log('UV version:', version.trim())
      } catch {
        console.error('UV not found after ensureUv:', e.message)
        process.exit(1)
      }
      `
    )

    const output = execSync(`bun ${testScript}`, {
      encoding: 'utf8',
      env: { ...process.env, __HOME__: TEMP_DIR }
    })

    expect(output).toContain('ensureUv completed successfully')
    expect(output).toContain('UV version:')
  }, 120000)

  it('should install uv and create working venv', () => {
    console.log('\nStep 2-3: Creating venv and verifying graphify...')

    const testScript = join(TEMP_DIR, 'test-venv-full.js')
    writeFileSync(
      testScript,
      `
      import { createVenv, venvExists } from '${join(REPO_PATH, '..', 'core', 'src', 'graphify.ts')}'
      import { execSync } from 'child_process'
      
      const brainPath = '${BRAIN_PATH}'
      console.log('Creating venv at:', brainPath)
      
      await createVenv(brainPath)
      
      const exists = venvExists(brainPath)
      console.log('Venv exists:', exists)
      
      if (!exists) {
        console.error('Venv was not created')
        process.exit(1)
      }
      
      // Verify graphify can be imported
      const venvPython = brainPath + '/.venv/bin/python3'
      try {
        const result = execSync(\`\${venvPython} -c "import graphify; print('Graphify OK')" 2>&1\`, { encoding: 'utf8' })
        console.log(result)
      } catch {
        console.error('Failed to import graphify')
        process.exit(1)
      }
      
      console.log('All checks passed!')
      `
    )

    const output = execSync(`bun ${testScript}`, {
      encoding: 'utf8',
      env: { ...process.env, __HOME__: TEMP_DIR }
    })

    expect(output).toContain('Venv exists: true')
    expect(output).toMatch(/Graphify OK|All checks passed/)
  }, 180000)

  it('should upgrade venv with auto-installed uv', () => {
    console.log('\nStep 4: Testing venv upgrade with auto-installed uv...')

    // Create venv first if it doesn't exist
    if (!existsSync(BRAIN_PATH)) {
      console.log('Creating brain path for upgrade test...')
      const setupScript = join(TEMP_DIR, 'test-venv-setup.js')
      writeFileSync(
        setupScript,
        `
        import { createVenv } from '${join(REPO_PATH, '..', 'core', 'src', 'graphify.ts')}'
        await createVenv('${BRAIN_PATH}')
        console.log('Venv created')
        `
      )
      execSync(`node ${setupScript}`, {
        encoding: 'utf8',
        env: { ...process.env, __HOME__: TEMP_DIR },
        stdio: 'inherit'
      })
    }

    const testScript = join(TEMP_DIR, 'test-venv-upgrade.js')
    writeFileSync(
      testScript,
      `
      import { upgradeVenv } from '${join(REPO_PATH, '..', 'core', 'src', 'graphify.ts')}'
      
      const brainPath = '${BRAIN_PATH}'
      console.log('Upgrading venv at:', brainPath)
      
      await upgradeVenv(brainPath)
      console.log('Upgrade completed successfully')
      `
    )

    const output = execSync(`bun ${testScript}`, {
      encoding: 'utf8',
      env: { ...process.env, __HOME__: TEMP_DIR }
    })

    expect(output).toContain('Upgrade completed successfully')
  }, 180000)
})
