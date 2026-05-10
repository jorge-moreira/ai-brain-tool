import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardHeader, CardContent, CardFooter } from '@ai-brain/ui/components/card'
import { Skeleton } from '@ai-brain/ui/components/skeleton'
import type { BrainInfo } from '@/shared/rpc-types'
import { rpc } from '@/lib/rpc'
import { CreateBrainDialog, ImportBrainDialog, BrainSettingsDialog } from '@/components/organisms'
import { EmptyDashboard, BrainsDashboard } from '@/screens/dashboard'

interface DashboardProps {
  onWizardComplete: () => void
}

export function Dashboard({ onWizardComplete: _onWizardComplete }: DashboardProps) {
  const [brains, setBrains] = useState<BrainInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [selectedBrain, setSelectedBrain] = useState<BrainInfo | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [syncingBrainId, setSyncingBrainId] = useState<string | null>(null)

  useEffect(() => {
    loadBrains()
  }, [])

  async function loadBrains() {
    setIsLoading(true)
    try {
      const brainList = await rpc.listBrains()
      setBrains(brainList)
    } catch (error) {
      console.error('Failed to load brains:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  function handleCreateBrain() {
    setTimeout(() => setIsCreateDialogOpen(true), 100)
  }

  function handleImportBrain() {
    setTimeout(() => setIsImportDialogOpen(true), 100)
  }

  async function handleDeleteBrain(brainId: string) {
    if (
      confirm(
        `Are you sure you want to delete "${brainId}"? This will only remove it from the app, not delete the folder.`
      )
    ) {
      try {
        await rpc.deleteBrain(brainId)
        loadBrains()
      } catch (error) {
        console.error('Failed to delete brain:', error)
      }
    }
  }

  async function handleSync(brainId: string) {
    setSyncingBrainId(brainId)
    try {
      const result = await rpc.syncBrain(brainId)
      if (result.gitSync === 'failed') {
        toast.warning('Brain rebuilt — git sync failed', {
          description: result.gitSyncError?.message ?? result.gitSyncError?.code ?? 'unknown',
          duration: 3000,
        })
      } else if (result.gitSync === 'ok') {
        toast.success('Brain synced and pushed', { duration: 2000 })
      } else {
        toast.success('Brain rebuilt', { duration: 2000 })
      }
    } catch (error) {
      toast.error('Sync failed', { description: error instanceof Error ? error.message : 'Unknown error', duration: 2000 })
    } finally {
      setSyncingBrainId(null)
    }
  }

  async function handleClearCache(brainId: string) {
    try {
      await rpc.clearCache(brainId)
      // Reload brains without showing loading state
      const brainList = await rpc.listBrains()
      setBrains(brainList)
      toast.success('Cache cleared', { duration: 2000 })
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast.error('Failed to clear cache', { duration: 2000 })
    }
  }

  async function handleOpenFolder(brainId: string) {
    try {
      await rpc.openBrainFolder(brainId)
    } catch (error) {
      console.error('Failed to open folder:', error)
    }
  }

  async function handleOpenObsidian(brainId: string) {
    try {
      await rpc.openBrainObsidian(brainId)
    } catch (error) {
      console.error('Failed to open Obsidian:', error)
    }
  }

  function handleAddTemplate(brainId: string) {
    console.log('Add template for:', brainId)
  }

  function handleSettings(brainId: string) {
    const brain = brains.find(b => b.id === brainId)
    if (brain) {
      setSelectedBrain(brain)
      setIsSettingsDialogOpen(true)
    }
  }

  async function handleSaveSettings(brain: BrainInfo) {
    try {
      await rpc.toggleSync(brain.id, brain.syncEnabled)
      loadBrains()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-full bg-background p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-32 h-6" />
          </div>
          <Skeleton className="w-24 h-9" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="w-32 h-5" />
                      <Skeleton className="w-40 h-3" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="w-12 h-4" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  <div className="flex gap-2">
                    <Skeleton className="w-9 h-9" />
                    <Skeleton className="w-9 h-9" />
                  </div>
                  <Skeleton className="w-24 h-9" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-background">
      {/* Dialog backdrop overlay */}
      {(isCreateDialogOpen || isImportDialogOpen || isSettingsDialogOpen) && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
      )}

      {brains.length === 0 ? (
        <EmptyDashboard onCreateBrain={handleCreateBrain} onImportBrain={handleImportBrain} />
      ) : (
        <BrainsDashboard
          brains={brains}
          formatSize={formatSize}
          onCreateBrain={handleCreateBrain}
          onImportBrain={handleImportBrain}
          onOpenFolder={handleOpenFolder}
          onClearCache={handleClearCache}
          onSettings={handleSettings}
          onSync={handleSync}
          syncingBrainId={syncingBrainId}
          onOpenObsidian={handleOpenObsidian}
          onDelete={handleDeleteBrain}
          onAddTemplate={handleAddTemplate}
        />
      )}

      <CreateBrainDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={async data => {
          setIsCreating(true)
          try {
            return await rpc.createBrain(data)
          } finally {
            setIsCreating(false)
          }
        }}
        onSuccess={loadBrains}
        dialogClassName="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[101]"
      />

      <ImportBrainDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSubmit={async path => {
          setIsImporting(true)
          try {
            return await rpc.importBrain(path)
          } finally {
            setIsImporting(false)
          }
        }}
        onSuccess={loadBrains}
        dialogClassName="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[101]"
      />

      <BrainSettingsDialog
        brain={selectedBrain}
        isOpen={isSettingsDialogOpen}
        onClose={() => {
          setIsSettingsDialogOpen(false)
          setSelectedBrain(null)
        }}
        onSave={handleSaveSettings}
        dialogClassName="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[101]"
      />
    </div>
  )
}
