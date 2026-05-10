// packages/app/src/mainview/components/atoms/ColorSwatch.tsx
import { cn } from '@ai-brain/ui/lib/utils'

export interface ColorSwatchProps {
  color: string
  selected?: boolean
  onClick?: () => void
  title?: string
  className?: string
}

/**
 * Circular color swatch button. Shows a white ring when selected.
 * Used in icon/color pickers.
 */
export function ColorSwatch({ color, selected = false, onClick, title, className }: ColorSwatchProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'w-6 h-6 rounded-full flex-shrink-0 transition-transform hover:scale-110 border-2',
        selected ? 'border-white shadow-[0_0_0_1px_white]' : 'border-transparent',
        className
      )}
      style={{ background: color }}
    />
  )
}
