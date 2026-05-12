import { useState, useEffect } from 'react'
import { Button } from '@ai-brain/ui/components/button'

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

export interface HexColorInputProps {
  value: string // current hex color, e.g. '#a187e3'
  onApply: (hex: string) => void
}

/**
 * Hex color text input with a live preview square and an Apply button.
 * Fires onApply only when the value is a valid 6-digit hex and the user
 * clicks Apply or presses Enter.
 * Used in BrainIconPicker custom color panel.
 */
export function HexColorInput({ value, onApply }: HexColorInputProps) {
  const [draft, setDraft] = useState(value)

  // Keep draft in sync when parent changes value (e.g. hue slider moved)
  useEffect(() => {
    setDraft(value)
  }, [value])

  const normalized = draft.startsWith('#') ? draft : `#${draft}`
  const isValid = isValidHex(normalized)

  function handleApply() {
    if (isValid) onApply(normalized)
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded flex-shrink-0 border border-border"
        style={{ background: isValid ? normalized : value }}
      />
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleApply()
        }}
        maxLength={7}
        placeholder="#000000"
        className="flex-1 h-8 bg-card border border-border rounded-md px-2 text-foreground text-xs font-mono outline-none focus:border-primary"
      />
      <Button
        type="button"
        size="sm"
        onClick={handleApply}
        disabled={!isValid}
        className="h-8 px-2.5 text-xs"
      >
        Apply
      </Button>
    </div>
  )
}
