import { Input } from '@ai-brain/ui/components/input'
import { cn } from '@ai-brain/ui/lib/utils'
import { ComponentProps } from 'react'

export interface FormInputProps extends ComponentProps<typeof Input> {
  label?: string
  hint?: string
}

export function FormInput({ label, hint, className, id, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Input
        id={id}
        className={cn(
          'bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
