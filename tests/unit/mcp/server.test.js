import { describe, it, expect } from 'vitest'

describe('mcp/server', () => {
  it('should export MCP_TOOLS array with 5 tools', async () => {
    const { MCP_TOOLS } = await import('../../../src/mcp/server.js')
    
    expect(Array.isArray(MCP_TOOLS)).toBe(true)
    expect(MCP_TOOLS.length).toBe(5)
  })

  it('should have brain_update tool', async () => {
    const { MCP_TOOLS } = await import('../../../src/mcp/server.js')
    const updateTool = MCP_TOOLS.find(t => t.name === 'brain_update')
    
    expect(updateTool).toBeDefined()
    expect(updateTool.description).toContain('Rebuild')
  })

  it('should have brain_query tool with inputSchema', async () => {
    const { MCP_TOOLS } = await import('../../../src/mcp/server.js')
    const queryTool = MCP_TOOLS.find(t => t.name === 'brain_query')
    
    expect(queryTool).toBeDefined()
    expect(queryTool.inputSchema).toBeDefined()
    expect(queryTool.inputSchema.properties.question).toBeDefined()
  })

  it('should have brain_path tool with source and target params', async () => {
    const { MCP_TOOLS } = await import('../../../src/mcp/server.js')
    const pathTool = MCP_TOOLS.find(t => t.name === 'brain_path')
    
    expect(pathTool).toBeDefined()
    expect(pathTool.inputSchema.properties.source).toBeDefined()
    expect(pathTool.inputSchema.properties.target).toBeDefined()
  })
})
