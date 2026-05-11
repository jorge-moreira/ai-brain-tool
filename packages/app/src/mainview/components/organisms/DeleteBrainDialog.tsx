import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@ai-brain/ui/components/dialog'
import { Checkbox } from '@/components/atoms'

export interface DeleteBrainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brainId: string | null
  onConfirm: (brainId: string, deleteFolder: boolean) => Promise<void>
  dialogClassName?: string
}

export function DeleteBrainDialog({
  open,
  onOpenChange,
  brainId,
  onConfirm,
  dialogClassName
}: DeleteBrainDialogProps) {
  const [deleteFolder, setDeleteFolder] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!brainId) return
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirm(brainId, deleteFolder)
      onOpenChange(false)
      setDeleteFolder(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete brain')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-[31.25rem] bg-background border border-border p-0 gap-0 [&>button]:hidden rounded-xl ${dialogClassName || ''}`}
      >
        <DialogTitle className="sr-only">Delete Brain</DialogTitle>
        <div className="p-6 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Delete Brain</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Remove "{brainId}" from the app and AI tools
          </p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground">
            This will remove the brain from the app and remove its MCP configuration from all AI
            tools.
          </p>

          <div className="flex items-start gap-3">
            <Checkbox
              id="deleteFolder"
              checked={deleteFolder}
              onCheckedChange={checked => setDeleteFolder(checked as boolean)}
              disabled={isDeleting}
              className="mt-0.5 text-destructive focus:ring-destructive/50"
            />
            <div className="flex-1 space-y-1">
              <label
                htmlFor="deleteFolder"
                className="text-sm font-medium text-destructive cursor-pointer"
              >
                Delete the brain folder and all its contents
              </label>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. All notes and data will be permanently deleted.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border bg-card">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-transparent border border-border rounded-md text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-destructive text-destructive-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
