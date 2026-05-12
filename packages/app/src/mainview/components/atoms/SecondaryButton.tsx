import { Button } from '@ai-brain/ui/components/button'
import { cn } from '@ai-brain/ui/lib/utils'
import { ComponentProps } from 'react'

export interface SecondaryButtonProps extends ComponentProps<typeof Button> {}

export function SecondaryButton({ className, children, ...props }: SecondaryButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn('border-border hover:bg-muted hover:border-primary-foreground', className)}
      {...props}
    >
      {children}
    </Button>
  )
}
