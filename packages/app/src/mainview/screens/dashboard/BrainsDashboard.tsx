import { useState } from 'react'
import { Button } from '@ai-brain/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ai-brain/ui/components/popover'
import { Icons } from '@ai-brain/ui/components/icons'
import type { BrainInfo } from '@/shared/rpc-types'
import { BrainCard, AddBrainPopoverContent } from '@/components/molecules'

interface BrainsDashboardProps {
  brains: BrainInfo[]
  formatSize: (bytes: number) => string
  onCreateBrain: () => void
  onImportBrain: () => void
  onOpenFolder: (brainId: string) => void
  onClearCache: (brainId: string) => void
  onSettings: (brainId: string) => void
  onSync: (brainId: string) => void
  syncingBrainId: string | null
  onOpenObsidian: (brainId: string) => void
  onDelete: (brainId: string) => void
  onAddTemplate: (brainId: string) => void
}

export function BrainsDashboard({
  brains,
  formatSize,
  onCreateBrain,
  onImportBrain,
  onOpenFolder,
  onClearCache,
  onSettings,
  onSync,
  syncingBrainId,
  onOpenObsidian,
  onDelete,
  onAddTemplate
}: BrainsDashboardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  function handleCreate() {
    setIsPopoverOpen(false)
    onCreateBrain()
  }

  function handleImport() {
    setIsPopoverOpen(false)
    onImportBrain()
  }

  return (
    <div className="flex flex-col w-full h-full bg-background p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <img src="/logo.svg" alt="AI Brain" className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">AI Brain Tool</h1>
        </div>

        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25">
              <div className="flex items-center">
                <Icons.plus className="w-4 h-4 mr-2" />
                Brain
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card border-border p-2" align="end">
            <AddBrainPopoverContent onCreate={handleCreate} onImport={handleImport} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Brain Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brains.map(brain => (
          <BrainCard
            key={brain.id}
            brain={brain}
            formatSize={formatSize}
            onOpenFolder={onOpenFolder}
            onClearCache={onClearCache}
            onSettings={onSettings}
            onSync={onSync}
            isSyncing={syncingBrainId === brain.id}
            onOpenObsidian={onOpenObsidian}
            onDelete={onDelete}
            onAddTemplate={onAddTemplate}
          />
        ))}
      </div>
    </div>
  )
}
