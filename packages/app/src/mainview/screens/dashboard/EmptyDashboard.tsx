import { Button } from '@ai-brain/ui/components/button'
import { Icons } from '@ai-brain/ui/components/icons'

interface EmptyDashboardProps {
  onCreateBrain: () => void
  onImportBrain: () => void
}

export function EmptyDashboard({ onCreateBrain, onImportBrain }: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="text-center space-y-6 max-w-md p-6">
        <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <img src="/logo.svg" alt="AI Brain" className="logo" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">No brains configured</h1>
          <p className="text-muted-foreground">
            Get started by creating a new brain or importing an existing one. Your brain will
            organize and enhance your AI conversations.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onCreateBrain}
            className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 w-52"
          >
            <div className="flex items-center justify-center gap-2">
              <Icons.plus className="w-4 h-4 shrink-0" />
              <span>Create brain</span>
            </div>
          </Button>
          <Button
            onClick={onImportBrain}
            variant="outline"
            className="border-border text-foreground hover:bg-muted w-52"
          >
            <div className="flex items-center justify-center gap-2">
              <Icons.download className="w-4 h-4 shrink-0" />
              <span>Import brain</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
