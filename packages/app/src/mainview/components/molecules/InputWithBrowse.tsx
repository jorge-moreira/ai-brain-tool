import { FormInput } from '@/components/atoms/FormInput'
import { SecondaryButton } from '@/components/atoms/SecondaryButton'

export interface InputWithBrowseProps {
  id?: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onBrowse: () => void
  hint?: string
  readOnly?: boolean
}

export function InputWithBrowse({
  id,
  label,
  placeholder,
  value,
  onChange,
  onBrowse,
  hint,
  readOnly
}: InputWithBrowseProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-2">
        <FormInput
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1"
          readOnly={readOnly}
        />
        <SecondaryButton onClick={onBrowse}>Browse</SecondaryButton>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
