import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WelcomeScreen } from '../../../src/renderer/src/components/InstallationWizard/WelcomeScreen'

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
  Check: () => <svg data-testid="check-icon" />
}))

describe('WelcomeScreen', () => {
  it('renders title and subtitle', () => {
    render(<WelcomeScreen onNext={vi.fn()} />)
    
    expect(screen.getByText('Welcome to AI Brain')).toBeInTheDocument()
    expect(
      screen.getByText('Your personal AI memory, connected to all your AI tools')
    ).toBeInTheDocument()
  })

  it('"Get Started" button triggers navigation', () => {
    const mockOnNext = vi.fn()
    render(<WelcomeScreen onNext={mockOnNext} />)
    
    const getStartedButton = screen.getByText('Get Started')
    fireEvent.click(getStartedButton)
    
    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('renders feature list with checkmarks', () => {
    render(<WelcomeScreen onNext={vi.fn()} />)
    
    expect(screen.getByText('Create knowledge graphs from your notes and documents')).toBeInTheDocument()
    expect(screen.getByText('Connect to your favorite AI tools (Claude Code, Copilot, Cursor, etc.)')).toBeInTheDocument()
    expect(screen.getByText('Sync across machines via git')).toBeInTheDocument()
  })
})
