import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectAll, installSkills } from '@ai-brain/core/platforms'

vi.mock('@ai-brain/core/platforms')

const mockedDetectAll = vi.mocked(detectAll)
const mockedInstallSkills = vi.mocked(installSkills)

describe('installSkills IPC Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters platforms by selectedKeys', async () => {
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
        detected: true 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    mockedInstallSkills.mockResolvedValue()
    
    const selectedKeys = ['claude']
    const selected = mockPlatforms.filter(p => selectedKeys.includes(p.key))
    await installSkills({ selected })
    
    expect(mockedInstallSkills).toHaveBeenCalledWith({ selected })
    expect(selected).toHaveLength(1)
    expect(selected[0].key).toBe('claude')
  })

  it('calls installSkills with filtered platforms', async () => {
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
        detected: true 
      },
      { 
        name: 'OpenCode', 
        key: 'opencode', 
        module: {} as any, 
        configHint: '~/.config/opencode/', 
        detected: true 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    mockedInstallSkills.mockResolvedValue()
    
    const selectedKeys = ['claude', 'opencode']
    const selected = mockPlatforms.filter(p => selectedKeys.includes(p.key))
    await installSkills({ selected })
    
    expect(mockedInstallSkills).toHaveBeenCalledWith({ 
      selected: expect.arrayContaining([
        expect.objectContaining({ key: 'claude' }),
        expect.objectContaining({ key: 'opencode' })
      ])
    })
  })

  it('returns { success: true } on success', async () => {
    const mockPlatforms = [
      { 
        name: 'Claude Code', 
        key: 'claude', 
        module: {} as any, 
        configHint: '~/.claude/', 
        detected: true 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    mockedInstallSkills.mockResolvedValue()
    
    const selected = mockPlatforms
    await expect(installSkills({ selected })).resolves.toBeUndefined()
  })

  it('returns { success: false, error } on failure', async () => {
    const mockPlatforms = [
      { 
        name: 'Claude Code', 
        key: 'claude', 
        module: {} as any, 
        configHint: '~/.claude/', 
        detected: true 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    mockedInstallSkills.mockRejectedValue(new Error('Installation failed'))
    
    const selected = mockPlatforms
    await expect(installSkills({ selected })).rejects.toThrow('Installation failed')
  })

  it('handles empty selected keys', async () => {
    const mockPlatforms = [
      { 
        name: 'Claude Code', 
        key: 'claude', 
        module: {} as any, 
        configHint: '~/.claude/', 
        detected: true 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    mockedInstallSkills.mockResolvedValue()
    
    const selectedKeys: string[] = []
    const selected = mockPlatforms.filter(p => selectedKeys.includes(p.key))
    await installSkills({ selected })
    
    expect(mockedInstallSkills).toHaveBeenCalledWith({ selected: [] })
  })

  it('handles all platforms selected', async () => {
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
        detected: true 
      }
    ]
    mockedDetectAll.mockResolvedValue(mockPlatforms)
    mockedInstallSkills.mockResolvedValue()
    
    const selectedKeys = ['claude', 'cursor']
    const selected = mockPlatforms.filter(p => selectedKeys.includes(p.key))
    await installSkills({ selected })
    
    expect(mockedInstallSkills).toHaveBeenCalledWith({ 
      selected: expect.arrayContaining([
        expect.objectContaining({ key: 'claude' }),
        expect.objectContaining({ key: 'cursor' })
      ])
    })
  })
})
