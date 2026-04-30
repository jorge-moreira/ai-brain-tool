import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock window.electronAPI
const mockElectronAPI = {
  // Brain commands
  getStatus: vi.fn(),
  update: vi.fn(),
  setup: vi.fn(),
  list: vi.fn(),

  // Config
  getConfig: vi.fn(),
  setConfig: vi.fn(),

  // App
  quit: vi.fn(),
  checkUpdates: vi.fn(),

  // Installation Wizard
  ensureUv: vi.fn(),
  detectPlatforms: vi.fn(),
  installSkills: vi.fn(),
  setWizardCompleted: vi.fn(),

  // Platform
  platform: 'darwin' as const,

  // Update events
  onUpdateAvailable: vi.fn(),
  onUpdateDownloaded: vi.fn(),
  onUpdateError: vi.fn()
}

// Setup for jsdom environment
if (typeof globalThis.window !== 'undefined') {
  Object.defineProperty(globalThis.window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
    configurable: true
  })

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    observe = vi.fn()
    disconnect = vi.fn()
    unobserve = vi.fn()
  }

  Object.defineProperty(globalThis.window, 'IntersectionObserver', {
    value: MockIntersectionObserver,
    writable: true,
    configurable: true
  })
}

// Export for tests to access mocks
export { mockElectronAPI }
