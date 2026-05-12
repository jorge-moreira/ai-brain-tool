import { globalVenvExists, createGlobalVenv } from '@ai-brain/core/graphify'

/**
 * Ensures uv and the global graphify venv are installed.
 * Idempotent — skips if already set up.
 * Used in BeforeAllScenarios hooks for features that require real graphify execution.
 * In normal CI flow, ai-brain setup --yes (setup.spec.ts) runs first and installs everything.
 * This is a safety net for local runs where setup may not have run.
 */
export async function ensureGraphify(): Promise<void> {
  if (globalVenvExists()) return
  await createGlobalVenv()
}
