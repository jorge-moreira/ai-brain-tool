import { Icons } from '@ai-brain/ui/components/icons'
import { PrimaryButton } from '@/components/atoms/PrimaryButton'
import { SecondaryButton } from '@/components/atoms/SecondaryButton'

export interface EmptyStateProps {
  onCreate: () => void
  onImport: () => void
}

export function EmptyState({ onCreate, onImport }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Icons.brain className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">No Brains Configured</h1>
          <p className="text-muted-foreground">
            Get started by creating a new brain or importing an existing one. Your brain will
            organize and enhance your AI conversations.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <PrimaryButton onClick={onCreate}>
            <Icons.plus className="w-4 h-4 mr-2" />
            Create New Brain
          </PrimaryButton>
          <SecondaryButton onClick={onImport}>
            <Icons.download className="w-4 h-4 mr-2" />
            Import Brain
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}
