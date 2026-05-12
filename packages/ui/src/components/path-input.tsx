import { Input } from '@/components/ui/input'

export interface PathInputProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
}

export function PathInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled
}: PathInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50"
      />
      {hint && !error && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      {error && <p className="text-xs text-destructive -mt-1">{error}</p>}
    </div>
  )
}
