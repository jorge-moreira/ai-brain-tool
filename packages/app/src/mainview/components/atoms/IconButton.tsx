import { Button } from '@ai-brain/ui/components/button'
import { cn } from '@ai-brain/ui/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

export interface IconButtonProps extends Omit<ComponentProps<typeof Button>, 'size' | 'variant'> {
  icon: ReactNode
  variant?: 'default' | 'destructive'
}

export function IconButton({ icon, variant = 'default', className, ...props }: IconButtonProps) {
  const variantStyles = {
    default: 'hover:border-primary hover:bg-muted',
    destructive: 'hover:border-destructive hover:bg-destructive/10 hover:text-destructive'
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-9 w-9 flex items-center justify-center border border-border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  )
}
