import { Separator } from '@ai-brain/ui/components/separator'

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  showDivider?: boolean
}

export function SettingsSection({ title, children, showDivider = false }: SettingsSectionProps) {
  return (
    <>
      {showDivider && <Separator className="my-6" />}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
        <div className="space-y-3">{children}</div>
      </section>
    </>
  )
}
