import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { createE2EContext, setupBrain, runCommand, cleanupContext } from './shared/e2e-helpers'

const feature = await loadFeature('tests/e2e/features/setup.feature')

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  const ctx = createE2EContext()
  Scenario('List shows configured brains', ({ Given, When, Then, And }) => {
    Given('I have a brain named "test-brain"', async () => {
      await setupBrain(ctx, 'test-brain')
    })

    When('I run the list command', async () => {
      await runCommand(ctx, 'list')
    })

    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })

    And('the output should contain "test-brain"', () => {
      expect(ctx.lastOutput).toContain('test-brain')
    })
  })

  Scenario('Status shows brain information', ({ Given, When, Then, And }) => {
    Given('I have a brain named "my-brain"', async () => {
      await setupBrain(ctx, 'my-brain')
    })

    When('I run the status command for "my-brain"', async () => {
      await runCommand(ctx, 'status', ['my-brain'])
    })

    Then('the command should succeed', () => {
      expect(ctx.lastExitCode).toBe(0)
    })

    And('the output should contain "Tool version:"', () => {
      expect(ctx.lastOutput).toContain('Tool version:')
    })
  })

  Scenario('Status shows brain path', ({ Given, When, Then }) => {
    Given('I have a brain named "work-brain"', async () => {
      await setupBrain(ctx, 'work-brain')
    })

    When('I run the status command for "work-brain"', async () => {
      await runCommand(ctx, 'status', ['work-brain'])
    })

    Then('the output should contain "Brain path:"', () => {
      expect(ctx.lastOutput).toContain('Brain path:')
    })
  })

  AfterEachScenario(() => {
    cleanupContext(ctx)
  })
})
