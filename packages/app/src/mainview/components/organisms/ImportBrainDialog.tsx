import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@ai-brain/ui/components/dialog'
import { PathInputWithBrowse } from '@/components/molecules/PathInputWithBrowse'

export interface ImportBrainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (path: string) => Promise<{ success: boolean; error?: string }>
  onSuccess: () => void
  dialogClassName?: string
}

export function ImportBrainDialog({
  open,
  onOpenChange,
  onSubmit,
  onSuccess,
  dialogClassName
}: ImportBrainDialogProps) {
  const [importPath, setImportPath] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!importPath) {
      setError('Please select a folder')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await onSubmit(importPath)

      if (result.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        setError(result.error || 'Failed to import brain')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import brain')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-[31.25rem] bg-card border border-border p-0 gap-0 [&>button]:hidden rounded-xl ${dialogClassName || ''}`}
      >
        <DialogTitle className="sr-only">Import Existing Brain</DialogTitle>
        <div className="p-6 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Import Existing Brain</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Import a brain folder that was created on another machine or manually.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <PathInputWithBrowse
            id="import-path"
            label="Brain Folder Path"
            value={importPath}
            onChange={setImportPath}
            placeholder="/path/to/existing/brain"
            hint="Select the folder containing your brain (should have .brain-config.json)"
          />

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
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-transparent border border-border rounded-md text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !importPath}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
