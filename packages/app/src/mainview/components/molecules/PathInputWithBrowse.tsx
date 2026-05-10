import { useState } from 'react'
import { PathInput } from '@ai-brain/ui/components/path-input'
import { rpc } from '@/lib/rpc'

export interface PathInputWithBrowseProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  disabled?: boolean
}

export function PathInputWithBrowse({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  disabled
}: PathInputWithBrowseProps) {
  const [isSelecting, setIsSelecting] = useState(false)

  async function handleBrowse() {
    setIsSelecting(true)
    try {
      console.log('[Browse] Calling selectFolder RPC...')
      const result = await rpc.selectFolder()
      console.log('[Browse] RPC result:', result)
      if (result.success && result.path) {
        console.log('[Browse] Setting path:', result.path)
        console.log('[Browse] Calling onChange with:', result.path)
        onChange(result.path)
        console.log('[Browse] onChange called')
      } else {
        console.log('[Browse] No path in result or success=false')
      }
    } catch (err) {
      console.error('[Browse] Failed to select folder:', err)
    } finally {
      setIsSelecting(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground block">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <PathInput
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled || isSelecting}
          />
        </div>
        <button
          type="button"
          onClick={handleBrowse}
          disabled={disabled || isSelecting}
          className="px-4 py-2.5 bg-transparent border border-border rounded-md text-foreground text-sm font-medium hover:bg-muted hover:border-primary-foreground transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed self-start"
        >
          {isSelecting ? '...' : 'Browse'}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
    </div>
  )
}
