import { Button } from '@ai-brain/ui/components/button'

interface ThemeButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

export function ThemeButton({ label, active, onClick }: ThemeButtonProps) {
  return (
    <Button variant={active ? 'default' : 'outline'} onClick={onClick} className="h-10 px-4">
      {label}
    </Button>
  )
}
