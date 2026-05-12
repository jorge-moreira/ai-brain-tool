import { cn } from '@ai-brain/ui/lib/utils'

export interface HueSliderProps {
  value: number // 0–360
  onChange: (hue: number) => void
  className?: string
}

/**
 * Rainbow hue range slider. Styled to match the app design system.
 * Used in BrainIconPicker custom color panel.
 */
export function HueSlider({ value, onChange, className }: HueSliderProps) {
  return (
    <input
      type="range"
      min={0}
      max={360}
      value={value}
      onChange={e => onChange(parseInt(e.target.value, 10))}
      className={cn(
        'hue-slider w-full h-2.5 rounded-full appearance-none outline-none border-none cursor-pointer',
        className
      )}
      style={{
        background:
          'linear-gradient(to right, hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))'
      }}
    />
  )
}
