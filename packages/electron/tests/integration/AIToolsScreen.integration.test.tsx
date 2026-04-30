import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIToolsScreen } from '../../src/renderer/src/components/InstallationWizard/AIToolsScreen'
import { mockElectronAPI } from '../setupTests'

vi.mock('@ai-brain/ui', async () => {
  const actual = await vi.importActual('@ai-brain/ui')
  return {
    ...actual,
    Button: ({ children, onClick, className, variant }: any) => (
      <button onClick={onClick} className={className} data-variant={variant}>
        {children}
      </button>
    ),
    Card: ({ children, className }: any) => (
      <div className={className}>{children}</div>
    ),
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardDescription: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <div>{children}</div>,
    CardFooter: ({ children }: any) => <div>{children}</div>,
    Checkbox: ({ checked, onCheckedChange }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        data-checked={checked}
      />
    ),
    Label: ({ children, className }: any) => (
      <label className={className}>{children}</label>
    ),
    Alert: ({ children }: any) => (
      <div data-testid="alert">{children}</div>
    ),
    AlertDescription: ({ children }: any) => <div>{children}</div>
  }
})

vi.mock('lucide-react', () => ({
  Info: () => <svg data-testid="info-icon" />
}))

describe('AIToolsScreen integration', () => {
  const mockPlatforms = [
    { name: 'Claude Code', key: 'claude', detected: true, configHint: '~/.claude/' },
    { name: 'Cursor', key: 'cursor', detected: false, configHint: '~/.cursor/' },
    { name: 'OpenCode', key: 'opencode', detected: true, configHint: '~/.config/opencode/' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detects platforms and renders checkboxes', async () => {
    mockElectronAPI.detectPlatforms.mockResolvedValue({
      success: true,
      data: mockPlatforms
    })

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.getByText(/Claude Code/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Cursor/i)).toBeInTheDocument()
    expect(screen.getAllByText(/OpenCode/i)).toHaveLength(2)
  })

  it('calls installSkills on continue with selected platforms', async () => {
    mockElectronAPI.detectPlatforms.mockResolvedValue({
      success: true,
      data: mockPlatforms
    })
    mockElectronAPI.installSkills.mockResolvedValue({ success: true })

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.getByText(/Claude Code/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(mockElectronAPI.installSkills).toHaveBeenCalledWith(['claude', 'opencode'])
    })

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledWith(['claude', 'opencode'])
    })
  })

  it('skips without calling installSkills', async () => {
    mockElectronAPI.detectPlatforms.mockResolvedValue({
      success: true,
      data: mockPlatforms
    })
    mockElectronAPI.installSkills.mockResolvedValue({ success: true })

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.getByText(/Claude Code/i)).toBeInTheDocument()
    })

    const skipButton = screen.getByText('Skip')
    fireEvent.click(skipButton)

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalled()
      expect(mockElectronAPI.installSkills).not.toHaveBeenCalled()
    })
  })

  it('shows loading state while detecting', async () => {
    mockElectronAPI.detectPlatforms.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockPlatforms }), 100))
    )

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    expect(screen.getByText(/Detecting installed tools/i)).toBeInTheDocument()
    expect(screen.getByText(/Please wait/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Which AI coding assistants do you use/i)).toBeInTheDocument()
    })
  })

  it('handles detectPlatforms error gracefully', async () => {
    mockElectronAPI.detectPlatforms.mockRejectedValue(new Error('Detection failed'))

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.queryByText(/Please wait/i)).not.toBeInTheDocument()
    })

    expect(mockElectronAPI.detectPlatforms).toHaveBeenCalled()
  })

  it('continues even if installSkills fails', async () => {
    mockElectronAPI.detectPlatforms.mockResolvedValue({
      success: true,
      data: mockPlatforms
    })
    mockElectronAPI.installSkills.mockRejectedValue(new Error('Install failed'))

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.getByText(/Claude Code/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onNext).toHaveBeenCalled()
    })
  })

  it('pre-selects detected platforms', async () => {
    mockElectronAPI.detectPlatforms.mockResolvedValue({
      success: true,
      data: mockPlatforms
    })

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.getByText(/Claude Code/i)).toBeInTheDocument()
    })

    const claudeCheckbox = screen.getByLabelText(/Claude Code/i)
    const cursorCheckbox = screen.getByLabelText(/Cursor/i)

    expect(claudeCheckbox).toBeChecked()
    expect(cursorCheckbox).not.toBeChecked()
  })

  it('allows toggling platform selection', async () => {
    mockElectronAPI.detectPlatforms.mockResolvedValue({
      success: true,
      data: mockPlatforms
    })
    mockElectronAPI.installSkills.mockResolvedValue({ success: true })

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.getByText(/Claude Code/i)).toBeInTheDocument()
    })

    const claudeCheckbox = screen.getByLabelText(/Claude Code/i)
    fireEvent.click(claudeCheckbox)

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(mockElectronAPI.installSkills).toHaveBeenCalledWith(['opencode'])
    })
  })

  it('handles empty platform list', async () => {
    mockElectronAPI.detectPlatforms.mockResolvedValue({
      success: true,
      data: []
    })

    const onNext = vi.fn()
    const onSkip = vi.fn()
    render(<AIToolsScreen onNext={onNext} onSkip={onSkip} />)

    await waitFor(() => {
      expect(screen.getByText(/Which AI coding assistants do you use/i)).toBeInTheDocument()
    })

    expect(screen.queryByText(/Claude Code/i)).not.toBeInTheDocument()

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledWith([])
    })
  })
})
