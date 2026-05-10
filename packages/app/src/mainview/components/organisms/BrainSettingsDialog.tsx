// packages/app/src/mainview/components/organisms/BrainSettingsDialog.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@ai-brain/ui/components/dialog'
import { Button } from '@ai-brain/ui/components/button'
import { Input } from '@ai-brain/ui/components/input'
import { Label } from '@ai-brain/ui/components/label'
import { Checkbox } from '@/components/atoms'
import { BrainIconPicker } from '@/components/molecules/BrainIconPicker'
import {
  getBrainIcon,
  BRAIN_ICON_OPTIONS,
  DEFAULT_BRAIN_ICON,
  DEFAULT_BRAIN_COLOR,
} from '@/components/atoms/Icons'
import { rpc } from '@/lib/rpc'
import type { BrainInfo } from '@/shared/rpc-types'

export interface BrainSettingsDialogProps {
  brain: BrainInfo | null
  isOpen: boolean
  onClose: () => void
  onSave: (brain: BrainInfo) => void
  dialogClassName?: string
}

export function BrainSettingsDialog({
  brain,
  isOpen,
  onClose,
  onSave,
  dialogClassName,
}: BrainSettingsDialogProps) {
  const [syncEnabled, setSyncEnabled]   = useState(false)
  const [draftIcon, setDraftIcon]       = useState(DEFAULT_BRAIN_ICON)
  const [draftColor, setDraftColor]     = useState(DEFAULT_BRAIN_COLOR)

  // Reset all local state when dialog opens with a (possibly different) brain
  useEffect(() => {
    if (brain) {
      setSyncEnabled(brain.syncEnabled)
      setDraftIcon(brain.icon ?? DEFAULT_BRAIN_ICON)
      setDraftColor(brain.iconColor ?? DEFAULT_BRAIN_COLOR)
    }
  }, [brain?.id, isOpen])

  if (!brain) return null

  const IconComp   = getBrainIcon(draftIcon)
  const iconLabel  = BRAIN_ICON_OPTIONS.find(o => o.key === draftIcon)?.label ?? 'Brain'

  async function handleSave() {
    if (!brain) return
    await rpc.saveBrainAppearance(brain.id, draftIcon, draftColor)
    onSave({ ...brain, syncEnabled, icon: draftIcon, iconColor: draftColor })
    onClose()
  }

  function handlePickerSave() {
    // Draft values are already in state — committed when dialog Save Changes is clicked.
  }

  function handlePickerCancel() {
    if (!brain) return
    // Revert draft to the last saved values from the brain prop
    setDraftIcon(brain.icon ?? DEFAULT_BRAIN_ICON)
    setDraftColor(brain.iconColor ?? DEFAULT_BRAIN_COLOR)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`w-full max-w-[31.25rem] bg-card border border-border p-0 gap-0 [&>button]:hidden rounded-xl ${dialogClassName || ''}`}
      >
        <DialogTitle className="sr-only">Brain Settings</DialogTitle>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Brain Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure settings for {brain.name}
          </p>
        </div>

        <div className="p-6 space-y-6">

          {/* Icon preview + picker */}
          <BrainIconPicker
            icon={draftIcon}
            iconColor={draftColor}
            onChange={(icon, color) => { setDraftIcon(icon); setDraftColor(color) }}
            onSave={handlePickerSave}
            onCancel={handlePickerCancel}
          >
            {/* Trigger: clickable icon preview */}
            <div className="flex items-center gap-3 cursor-pointer w-fit">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ background: `${draftColor}20` }}
              >
                <IconComp size={24} color={draftColor} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{iconLabel}</p>
                <p className="text-xs text-muted-foreground">Click to change icon &amp; color</p>
              </div>
            </div>
          </BrainIconPicker>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="brain-name">Name</Label>
            <Input
              id="brain-name"
              value={brain.name}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Path */}
          <div className="space-y-2">
            <Label htmlFor="brain-path">Path</Label>
            <Input
              id="brain-path"
              value={brain.path}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-xs"
            />
          </div>

          {/* Sync toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="sync-toggle">Sync Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Automatically sync this brain with remote storage
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sync-toggle"
                checked={syncEnabled}
                onCheckedChange={checked => setSyncEnabled(checked === true)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/30">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
