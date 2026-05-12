import { Button } from '@ai-brain/ui/components/button'
import { cn } from '@ai-brain/ui/lib/utils'
import { ComponentProps } from 'react'

export interface PrimaryButtonProps extends Omit<ComponentProps<typeof Button>, 'variant'> {
  variant?: 'create' | 'import' | 'default'
}

export function PrimaryButton({
  className,
  variant = 'default',
  children,
  ...props
}: PrimaryButtonProps) {
  const baseStyles = 'shadow-lg transition-all hover:opacity-90'

  const variantStyles = {
    default: 'bg-primary text-primary-foreground shadow-primary/25',
    create: 'bg-primary text-primary-foreground shadow-primary/25',
    import: 'bg-secondary text-secondary-foreground shadow-secondary/25'
  }

  return (
    <Button className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </Button>
  )
}
