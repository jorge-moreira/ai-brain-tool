// packages/app/src/mainview/components/molecules/BrainIconPicker.tsx
import { useState, useEffect, useRef } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@ai-brain/ui/components/popover'
import { Button } from '@ai-brain/ui/components/button'
import { Plus } from 'lucide-react'
import { cn } from '@ai-brain/ui/lib/utils'
import { BRAIN_ICON_OPTIONS, DEFAULT_BRAIN_COLOR } from '@/components/atoms/Icons'
import { ColorSwatch } from '@/components/atoms/ColorSwatch'
import { HueSlider } from '@/components/atoms/HueSlider'
import { HexColorInput } from '@/components/atoms/HexColorInput'

// Color utils
function hsl2hex(h: number): string {
  const s = 0.85,
    l = 0.55
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  if (max === r) return ((g - b) / d + (g < b ? 6 : 0)) * 60
  if (max === g) return ((b - r) / d + 2) * 60
  return ((r - g) / d + 4) * 60
}

const PRESET_COLORS = [
  { label: 'Purple', value: '#a187e3' },
  { label: 'Blue', value: '#2590f9' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Pink', value: '#ec4899' }
]

export interface BrainIconPickerProps {
  icon: string
  iconColor: string
  onChange: (icon: string, iconColor: string) => void
  onSave: () => void
  onCancel: () => void
  children: React.ReactNode
}

export function BrainIconPicker({
  icon,
  iconColor,
  onChange,
  onSave,
  onCancel,
  children
}: BrainIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [hue, setHue] = useState(() => hexToHue(iconColor) || 0)
  const [customColor, setCustomColor] = useState<string | null>(null)
  const skipCancelRef = useRef(false)

  // Sync hue when iconColor changes (preset click)
  useEffect(() => {
    setHue(hexToHue(iconColor) || 0)
  }, [iconColor])

  function handleOpenChange(next: boolean) {
    if (!next && !skipCancelRef.current) {
      onCancel()
      setCustomOpen(false)
    }
    skipCancelRef.current = false
    setOpen(next)
  }

  function handleSave() {
    skipCancelRef.current = true
    onSave()
    setOpen(false)
    setCustomOpen(false)
    setCustomColor(null)
  }

  function handleCancel() {
    skipCancelRef.current = true
    onCancel()
    setOpen(false)
    setCustomOpen(false)
    setCustomColor(null)
  }

  function handleHueChange(h: number) {
    setHue(h)
    onChange(icon, hsl2hex(h))
  }

  function handleHexApply(hex: string) {
    setHue(hexToHue(hex))
    onChange(icon, hex)
    setCustomColor(hex)
    setCustomOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-80 p-0 bg-surface-container-high border-border rounded-xl shadow-2xl z-[200]"
      >
        <div className="p-3.5 flex flex-col gap-3.5">
          {/* Icon grid */}
          <div>
            <p className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Icon
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {BRAIN_ICON_OPTIONS.map(opt => {
                const IconComp = opt.component
                const isSelected = opt.key === icon
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    onClick={() => onChange(opt.key, iconColor)}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center border transition-all',
                      'bg-muted text-muted-foreground',
                      isSelected
                        ? 'border-primary shadow-[0_0_0_2px] shadow-primary'
                        : 'border-border hover:border-primary hover:text-foreground'
                    )}
                    style={{ color: isSelected ? iconColor : undefined }}
                  >
                    <IconComp size={16} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color row */}
          <div>
            <p className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Color
            </p>
            <div className="flex gap-1.5 items-center flex-wrap">
              {PRESET_COLORS.map(c => (
                <ColorSwatch
                  key={c.value}
                  color={c.value}
                  selected={c.value.toLowerCase() === iconColor.toLowerCase()}
                  title={c.label}
                  onClick={() => onChange(icon, c.value)}
                />
              ))}
              {/* Custom color toggle */}
              <button
                type="button"
                title="Custom color"
                onClick={() => setCustomOpen(v => !v)}
                className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground flex-shrink-0 flex items-center justify-center hover:border-primary transition-colors"
                style={customColor ? { background: customColor } : {}}
              >
                <Plus size={10} className="text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
              </button>
            </div>

            {/* Custom color panel — expands inline, does not close popover */}
            {customOpen && (
              <div className="mt-2 p-3 bg-muted border border-border rounded-lg flex flex-col gap-2.5">
                <HueSlider value={hue} onChange={handleHueChange} />
                <HexColorInput value={iconColor} onApply={handleHexApply} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2.5 flex justify-end gap-2 rounded-b-xl">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
