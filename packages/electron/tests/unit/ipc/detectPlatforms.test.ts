import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectAll } from '@ai-brain/core/platforms'

vi.mock('@ai-brain/core/platforms')

const mockedDetectAll = vi.mocked(detectAll)

describe('detectPlatforms IPC Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls detectAll from @ai-brain/core/platforms', async () => {
    mockedDetectAll.mockResolvedValue([
      { 
        name: 'Claude Code', 
        key: 'claude', 
        module: {} as any, 
        configHint: '~/.claude/', 
        detected: true 
      }
    ])
    
    await detectAll()
    
    expect(mockedDetectAll).toHaveBeenCalledTimes(1)
  })

  it('returns { success: true, data: platforms } on success', async () => {
    const mockPlatforms = [
      { 
        name: 'Claude Code', 
        key: 'claude', 
        module: {} as any, 
        configHint: '~/.claude/', 
        detected: true 
      },
      { 
        name: 'Cursor', 
        key: 'cursor', 
        module: {} as any, 
        configHint: '~/.cursor/', 
        detected: false 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    
    const result = await detectAll()
    
    expect(result).toEqual(mockPlatforms)
  })

  it('returns { success: false, error, data: [] } on failure', async () => {
    mockedDetectAll.mockRejectedValue(new Error('Detection failed'))
    
    await expect(detectAll()).rejects.toThrow('Detection failed')
  })

  it('handles empty platform list', async () => {
    mockedDetectAll.mockResolvedValue([])
    
    const result = await detectAll()
    
    expect(result).toEqual([])
  })

  it('detects multiple platforms', async () => {
    const mockPlatforms = [
      { 
        name: 'Claude Code', 
        key: 'claude', 
        module: {} as any, 
        configHint: '~/.claude/', 
        detected: true 
      },
      { 
        name: 'OpenCode', 
        key: 'opencode', 
        module: {} as any, 
        configHint: '~/.config/opencode/', 
        detected: true 
      },
      { 
        name: 'Cursor', 
        key: 'cursor', 
        module: {} as any, 
        configHint: '~/.cursor/', 
        detected: false 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    
    const result = await detectAll()
    
    expect(result).toHaveLength(3)
    expect(result.filter(p => p.detected)).toHaveLength(2)
  })
})
