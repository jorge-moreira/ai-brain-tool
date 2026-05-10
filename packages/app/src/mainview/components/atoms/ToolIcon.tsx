interface ToolIconProps {
  toolKey: string
}

export function ToolIcon({ toolKey }: ToolIconProps) {
  const iconConfig: Record<string, { bg: string; color: string; label: string }> = {
    claude: { bg: 'rgba(255, 100, 50, 0.1)', color: 'rgb(255, 100, 50)', label: 'C' },
    gemini: { bg: 'rgba(66, 133, 244, 0.1)', color: 'rgb(66, 133, 244)', label: 'G' },
    cursor: { bg: 'rgba(161, 135, 227, 0.1)', color: 'rgb(161, 135, 227)', label: 'Cu' },
    copilot: { bg: 'rgba(100, 100, 100, 0.1)', color: 'rgb(100, 100, 100)', label: 'GH' },
    codex: { bg: 'rgba(37, 144, 249, 0.1)', color: 'rgb(37, 144, 249)', label: 'O' },
    opencode: { bg: 'rgba(161, 135, 227, 0.1)', color: 'rgb(161, 135, 227)', label: 'OC' }
  }

  const config = iconConfig[toolKey] || { bg: 'rgba(100, 100, 100, 0.1)', color: 'rgb(100, 100, 100)', label: '?' }

  return (
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </div>
  )
}
