import { Checkbox } from '@/components/atoms/Checkbox'
import { Label } from '@ai-brain/ui/components/label'
import { cn } from '@ai-brain/ui/lib/utils'

export interface FormCheckboxProps {
  id: string
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  indent?: boolean
}

export function FormCheckbox({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
  className,
  indent = false
}: FormCheckboxProps) {
  return (
    <div className={cn('flex items-start space-x-3', indent && 'pl-8', className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={checked => onCheckedChange(checked === true)}
        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
