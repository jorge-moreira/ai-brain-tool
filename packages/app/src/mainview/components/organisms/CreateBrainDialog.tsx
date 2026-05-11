import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@ai-brain/ui/components/dialog'
import { PathInputWithBrowse } from '@/components/molecules/PathInputWithBrowse'

export interface CreateBrainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    name: string
    path: string
    useGit: boolean
    gitRemote?: string
    gitSync: boolean
    configureObsidian: boolean
    obsidianDir: string | null
    openInObsidian?: boolean
  }) => Promise<{ success: boolean; error?: string }>
  onSuccess: () => void
  dialogClassName?: string
}

interface FormData {
  name: string
  path: string
  useGit: boolean
  gitRemote: string
  gitSync: boolean
  configureObsidian: boolean
  obsidianDir: string
  openInObsidian: boolean
}

export function CreateBrainDialog({
  open,
  onOpenChange,
  onSubmit,
  onSuccess,
  dialogClassName
}: CreateBrainDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    path: '',
    useGit: false,
    gitRemote: '',
    gitSync: false,
    configureObsidian: false,
    obsidianDir: '',
    openInObsidian: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!formData.name || !formData.path) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await onSubmit({
        name: formData.name,
        path: formData.path,
        useGit: formData.useGit,
        gitRemote: formData.gitRemote || undefined,
        gitSync: formData.gitSync,
        configureObsidian: formData.configureObsidian,
        obsidianDir: formData.configureObsidian ? formData.obsidianDir : null,
        openInObsidian: formData.openInObsidian
      })

      if (result.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        setError(result.error || 'Failed to create brain')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brain')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-[31.25rem] bg-card border border-border p-0 gap-0 [&>button]:hidden rounded-xl ${dialogClassName || ''}`}
      >
        <DialogTitle className="sr-only">Create New Brain</DialogTitle>
        <div className="p-6 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Create New Brain</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set up a new brain to organize and enhance your AI conversations.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="brain-name" className="text-sm font-medium text-foreground">
              Brain Name
            </label>
            <input
              id="brain-name"
              type="text"
              placeholder="e.g., work, personal, research"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <PathInputWithBrowse
            id="brain-path"
            label="Location"
            value={formData.path}
            onChange={value => {
              console.log('[CreateBrainDialog] Path onChange called with:', value)
              setFormData(prev => ({ ...prev, path: value }))
            }}
            placeholder="/path/to/brain-folder"
            hint="The brain folder will be created at this location"
          />

          <div className="h-px bg-border -mx-6" />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="use-git"
                checked={formData.useGit}
                onChange={e => setFormData(prev => ({ ...prev, useGit: e.target.checked }))}
                className="w-4.5 h-4.5 mt-0.5 border-2 border-border rounded bg-background text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="use-git"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Initialize Git Repository
                </label>
                <p className="text-xs text-muted-foreground">
                  Track changes and sync across machines
                </p>
              </div>
            </div>

            {formData.useGit && (
              <>
                <div className="space-y-2 pl-8">
                  <label htmlFor="git-remote" className="text-sm font-medium text-foreground">
                    Git Remote URL (optional)
                  </label>
                  <input
                    id="git-remote"
                    type="text"
                    placeholder="git@github.com:user/repo.git"
                    value={formData.gitRemote}
                    onChange={e => setFormData(prev => ({ ...prev, gitRemote: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>

                <div className="flex items-start gap-3 pl-8">
                  <input
                    type="checkbox"
                    id="git-sync"
                    checked={formData.gitSync}
                    onChange={e => setFormData(prev => ({ ...prev, gitSync: e.target.checked }))}
                    className="w-4.5 h-4.5 mt-0.5 border-2 border-border rounded bg-background text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
                  />
                  <label
                    htmlFor="git-sync"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Auto-sync after brain updates
                  </label>
                </div>
              </>
            )}

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="configure-obsidian"
                checked={formData.configureObsidian}
                onChange={e => setFormData(prev => ({ ...prev, configureObsidian: e.target.checked }))}
                className="w-4.5 h-4.5 mt-0.5 border-2 border-border rounded bg-background text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="configure-obsidian"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Configure Obsidian
                </label>
                <p className="text-xs text-muted-foreground">
                  Set up Obsidian vault integration
                </p>
              </div>
            </div>

            {formData.configureObsidian && (
              <div className="space-y-2 pl-8">
                <PathInputWithBrowse
                  id="obsidian-dir"
                  label="Obsidian Vault Path"
                  value={formData.obsidianDir}
                  onChange={value => setFormData(prev => ({ ...prev, obsidianDir: value }))}
                  placeholder="/path/to/obsidian-vault"
                  hint="Leave empty to use the brain folder as vault"
                />
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="open-in-obsidian"
                    checked={formData.openInObsidian}
                    onChange={e => setFormData(prev => ({ ...prev, openInObsidian: e.target.checked }))}
                    className="w-4.5 h-4.5 mt-0.5 border-2 border-border rounded bg-background text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor="open-in-obsidian"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Open in Obsidian after creation
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Launch Obsidian and add this brain as a vault (if not already added)
                    </p>
                  </div>
                </div>
              </div>
            )}
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
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-transparent border border-border rounded-md text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name || !formData.path}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
