import { Badge } from '@ai-brain/ui/components/badge'

interface StatusBadgeProps {
  status: 'installed' | 'not-installed'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'installed') {
    return (
      <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/10 text-xs font-medium min-w-[80px] justify-center">
        Installed
      </Badge>
    )
  }

  return (
    <Badge className="bg-muted text-muted-foreground hover:bg-muted text-xs font-medium min-w-[80px] justify-center">
      Not installed
    </Badge>
  )
}
