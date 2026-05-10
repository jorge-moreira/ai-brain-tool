import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { TooltipContent } from '@ai-brain/ui/components/tooltip'
import { cn } from '@ai-brain/ui/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

export type AppTooltipContentProps = ComponentPropsWithoutRef<typeof TooltipContent>

export function AppTooltipContent({ className, children, ...props }: AppTooltipContentProps) {
  return (
    <TooltipContent className={cn('tooltip-content', className)} {...props}>
      {children}
      <TooltipPrimitive.Arrow className="fill-foreground" />
    </TooltipContent>
  )
}
