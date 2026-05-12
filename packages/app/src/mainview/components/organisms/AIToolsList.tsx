import { useState } from 'react'
import { ToolItem } from '@/components/molecules/ToolItem'
import { toast } from 'sonner'
import { rpc } from '@/lib/rpc'

export interface AIToolsListProps {
  tools: Array<{
    key: string
    name: string
    description: string
    detected: boolean
  }>
  installedTools: string[]
}

interface ToolState {
  key: string
  name: string
  description: string
  installed: boolean
  installing: boolean
  showInstallButton: boolean
}

export function AIToolsList({ tools, installedTools }: AIToolsListProps) {
  const [toolStates, setToolStates] = useState<ToolState[]>(() =>
    tools.map(tool => ({
      key: tool.key,
      name: tool.name,
      description: tool.description,
      installed: installedTools.includes(tool.key),
      installing: false,
      showInstallButton: false
    }))
  )

  const handleShowInstall = (toolKey: string) => {
    setToolStates(prev =>
      prev.map(tool => (tool.key === toolKey ? { ...tool, showInstallButton: true } : tool))
    )
  }

  const handleInstall = async (toolKey: string) => {
    setToolStates(prev =>
      prev.map(tool => (tool.key === toolKey ? { ...tool, installing: true } : tool))
    )

    try {
      const tool = tools.find(t => t.key === toolKey)
      if (!tool) throw new Error('Tool not found')

      await rpc.installSkills([tool.key])

      // Update state after successful installation
      setToolStates(prev =>
        prev.map(tool =>
          tool.key === toolKey
            ? { ...tool, installed: true, installing: false, showInstallButton: false }
            : tool
        )
      )

      toast.success(`Skill installed for ${tool.name}`, { duration: 2000 })
    } catch (error) {
      toast.error(
        `Failed to install skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { duration: 2000 }
      )
      setToolStates(prev =>
        prev.map(tool => (tool.key === toolKey ? { ...tool, installing: false } : tool))
      )
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Installed tools have the /brain skill. Click a row to show install option.
      </p>
      <div className="space-y-3">
        {toolStates.map(tool => (
          <ToolItem
            key={tool.key}
            toolKey={tool.key}
            name={tool.name}
            description={tool.description}
            installed={tool.installed}
            installing={tool.installing}
            onShowInstall={() => handleShowInstall(tool.key)}
            onInstall={() => handleInstall(tool.key)}
          />
        ))}
      </div>
    </div>
  )
}
