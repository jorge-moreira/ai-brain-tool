import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompleteScreen } from '../../../src/renderer/src/components/InstallationWizard/CompleteScreen'

vi.mock('@ai-brain/ui', async () => {
  const actual = await vi.importActual('@ai-brain/ui')
  return {
    ...actual,
    Button: ({ children, onClick, className }: any) => (
      <button onClick={onClick} className={className}>
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
    CardFooter: ({ children }: any) => <div>{children}</div>
  }
})

vi.mock('lucide-react', () => ({
  CheckCircle: () => <svg data-testid="check-circle-icon" />
}))

describe('CompleteScreen', () => {
  it('renders title and subtitle', () => {
    render(<CompleteScreen onLaunch={vi.fn()} />)
    
    expect(screen.getByText("You're All Set!")).toBeInTheDocument()
    expect(screen.getByText('AI Brain is ready to use')).toBeInTheDocument()
  })

  it('"Launch App" triggers completion', () => {
    const mockOnLaunch = vi.fn()
    render(<CompleteScreen onLaunch={mockOnLaunch} />)
    
    const launchButton = screen.getByText('Launch App')
    fireEvent.click(launchButton)
    
    expect(mockOnLaunch).toHaveBeenCalledTimes(1)
  })

  it('renders success icon', () => {
    render(<CompleteScreen onLaunch={vi.fn()} />)
    
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
  })

  it('renders completion message', () => {
    render(<CompleteScreen onLaunch={vi.fn()} />)
    
    expect(
      screen.getByText('Your Python environment is configured and AI tools are ready.')
    ).toBeInTheDocument()
  })
})
