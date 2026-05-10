import { describe, it, expect } from 'vitest'
import { MCP_TOOLS } from '@ai-brain/core/mcp/server'

describe('MCP tools', () => {
  it('should export MCP_TOOLS array', () => {
    expect(Array.isArray(MCP_TOOLS)).toBe(true)
    expect(MCP_TOOLS.length).toBeGreaterThan(0)
  })
})
