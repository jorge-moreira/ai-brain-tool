import { ToolIcon } from '@/components/atoms/ToolIcon'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { Button } from '@ai-brain/ui/components/button'

export interface ToolItemProps {
  toolKey: string
  name: string
  description: string
  installed: boolean
  installing?: boolean
  onShowInstall?: () => void
  onInstall?: () => void
}

export function ToolItem({
  toolKey,
  name,
  description,
  installed,
  installing = false,
  onShowInstall,
  onInstall
}: ToolItemProps) {
  const handleClick = () => {
    if (!installed && onShowInstall) {
      onShowInstall()
    }
  }

  return (
    <div
      className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg transition-colors ${
        !installed ? 'cursor-pointer hover:border-primary' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <ToolIcon toolKey={toolKey} />
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {installed ? (
        <StatusBadge status="installed" />
      ) : installing ? (
        <Button size="sm" disabled className="h-8 min-w-[80px]">
          Installing...
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="pointer-events-none">
            <StatusBadge status="not-installed" />
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onInstall?.()
            }}
            className="h-8 min-w-[80px]"
          >
            Install
          </Button>
        </div>
      )}
    </div>
  )
}
