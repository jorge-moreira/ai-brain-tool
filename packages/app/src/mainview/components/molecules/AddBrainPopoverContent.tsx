import { Badge } from '@ai-brain/ui/components/badge'
import { Icons } from '@ai-brain/ui/components/icons'

export interface AddBrainPopoverProps {
  onCreate: () => void
  onImport: () => void
}

export function AddBrainPopoverContent({ onCreate, onImport }: AddBrainPopoverProps) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onCreate}
        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
      >
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <Icons.plus className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">Create New</div>
          <div className="text-xs text-muted-foreground">Set up from scratch</div>
        </div>
        <Badge className="bg-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wide">
          New
        </Badge>
      </button>
      <button
        type="button"
        onClick={onImport}
        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
      >
        <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
          <Icons.download className="w-5 h-5 text-secondary-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">Import</div>
          <div className="text-xs text-muted-foreground">From folder or git</div>
        </div>
        <Badge className="bg-secondary/20 text-secondary text-[10px] font-semibold uppercase tracking-wide">
          Existing
        </Badge>
      </button>
    </div>
  )
}
