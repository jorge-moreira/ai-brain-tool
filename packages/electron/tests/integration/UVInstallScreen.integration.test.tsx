import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UVInstallScreen } from '../../src/renderer/src/components/InstallationWizard/UVInstallScreen'
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
    Progress: ({ value }: any) => (
      <div data-testid="progress" data-value={value}>progress</div>
    ),
    Alert: ({ children, variant }: any) => (
      <div data-testid="alert" data-variant={variant}>{children}</div>
    ),
    AlertDescription: ({ children }: any) => <div>{children}</div>,
    AlertTitle: ({ children }: any) => <div>{children}</div>
  }
})

vi.mock('lucide-react', () => ({
  AlertCircle: () => <svg data-testid="alert-icon" />,
  CheckCircle2: () => <svg data-testid="check-icon" />
}))

describe('UVInstallScreen integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls ensureUv and advances on success', async () => {
    mockElectronAPI.ensureUv.mockResolvedValue({ success: true })

    const onSuccess = vi.fn()
    render(<UVInstallScreen onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(mockElectronAPI.ensureUv).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows error on failure', async () => {
    mockElectronAPI.ensureUv.mockResolvedValue({
      success: false,
      error: 'Network error'
    })

    const onSuccess = vi.fn()
    render(<UVInstallScreen onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it('shows error when ensureUv throws', async () => {
    mockElectronAPI.ensureUv.mockRejectedValue(new Error('Installation failed'))

    const onSuccess = vi.fn()
    render(<UVInstallScreen onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(screen.getByText(/Installation failed/i)).toBeInTheDocument()
    })
  })

  it('displays progress during installation', async () => {
    mockElectronAPI.ensureUv.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100)
      })
    })

    const onSuccess = vi.fn()
    render(<UVInstallScreen onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(screen.getByText(/Checking for UV/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText(/Installation complete!/i)).toBeInTheDocument()
    })
  })

  it('allows retry on error', async () => {
    mockElectronAPI.ensureUv
      .mockResolvedValueOnce({ success: false, error: 'First attempt failed' })
      .mockResolvedValueOnce({ success: true })

    const onSuccess = vi.fn()
    render(<UVInstallScreen onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(screen.getByText(/First attempt failed/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    retryButton.click()

    await waitFor(() => {
      expect(mockElectronAPI.ensureUv).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
