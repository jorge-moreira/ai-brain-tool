import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@ai-brain/ui/components/card'
import { Icons } from '@ai-brain/ui/components/icons'
import { getBrainIcon, DEFAULT_BRAIN_ICON, DEFAULT_BRAIN_COLOR } from '@/components/atoms/Icons'
import { IconButton } from '@/components/atoms/IconButton'
import { AppTooltipContent } from '@/components/atoms/AppTooltipContent'
import { Tooltip, TooltipTrigger } from '@ai-brain/ui/components/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@ai-brain/ui/components/context-menu'
import type { BrainInfo } from '@/shared/rpc-types'

export interface BrainCardProps {
  brain: BrainInfo
  onOpenFolder: (id: string) => void
  onClearCache: (id: string) => void
  onSettings: (id: string) => void
  onSync: (id: string) => void
  isSyncing?: boolean
  onOpenObsidian: (id: string) => void
  onDelete: (id: string) => void
  onAddTemplate: (id: string, type: 'obsidian' | 'webclipper') => void
  formatSize: (bytes: number) => string
}

export function BrainCard({
  brain,
  onOpenFolder,
  onClearCache,
  onSettings,
  onSync,
  isSyncing = false,
  onOpenObsidian,
  onDelete,
  onAddTemplate,
  formatSize
}: BrainCardProps) {
  const BrainIcon  = getBrainIcon(brain.icon ?? DEFAULT_BRAIN_ICON)
  const brainColor = brain.iconColor ?? DEFAULT_BRAIN_COLOR
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card className="border-border bg-card hover:border-primary transition-colors group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: `${brainColor}20` }}
                >
                  <BrainIcon size={20} color={brainColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold text-foreground truncate">
                    {brain.name}
                  </CardTitle>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
                <Icons.more className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="pb-3">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Icons.drive className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {formatSize(brain.sizeBytes)}
                  </div>
                  <div className="text-xs text-muted-foreground">Size</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icons.file className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">{brain.notesCount}</div>
                  <div className="text-xs text-muted-foreground">Notes</div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border pt-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      icon={<Icons.folder className="w-4 h-4" />}
                      onClick={() => onOpenFolder(brain.id)}
                    />
                  </TooltipTrigger>
                  <AppTooltipContent>Open Folder</AppTooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      icon={<Icons.trash className="w-4 h-4" />}
                      variant="destructive"
                      onClick={() => onClearCache(brain.id)}
                    />
                  </TooltipTrigger>
                  <AppTooltipContent>Clear Cache</AppTooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      icon={<Icons.settings className="w-4 h-4" />}
                      onClick={() => onSettings(brain.id)}
                    />
                  </TooltipTrigger>
                  <AppTooltipContent>Settings</AppTooltipContent>
                </Tooltip>
              </div>

              {brain.syncEnabled && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      icon={<Icons.sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
                      onClick={() => !isSyncing && onSync(brain.id)}
                      disabled={isSyncing}
                      className={isSyncing
                        ? 'bg-secondary border-secondary text-secondary-foreground hover:bg-secondary hover:border-secondary'
                        : 'bg-[#2ecc71] border-[#2ecc71] text-[#0b1321] hover:bg-[#27ae60] hover:border-[#27ae60]'
                      }
                    />
                  </TooltipTrigger>
                  <AppTooltipContent>{isSyncing ? 'Syncing…' : 'Sync'}</AppTooltipContent>
                </Tooltip>
              )}
            </div>
          </CardFooter>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent className="app-context-menu w-[17.5rem]">
        <ContextMenuSub>
          <ContextMenuSubTrigger className="app-context-menu-item w-full data-[state=open]:bg-surface-container-high">
            <Icons.folder className="w-4 h-4" data-icon />
            Open
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="app-context-menu w-[12.5rem]" sideOffset={8} alignOffset={-4}>
            <ContextMenuItem className="app-context-menu-item" onClick={() => onOpenFolder(brain.id)}>
              <Icons.folder className="w-4 h-4" data-icon />
              Folder
            </ContextMenuItem>
            <ContextMenuItem className="app-context-menu-item" onClick={() => onOpenObsidian(brain.id)} disabled={!brain.obsidianConfigured}>
              <Icons.obsidian className="w-4 h-4" data-icon />
              Obsidian
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger className="app-context-menu-item w-full data-[state=open]:bg-surface-container-high">
            <Icons.plus className="w-4 h-4" data-icon />
            Add Template
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="app-context-menu w-[12.5rem]" sideOffset={8} alignOffset={-4}>
            <ContextMenuItem className="app-context-menu-item" onClick={() => onAddTemplate(brain.id, 'obsidian')}>
              <Icons.obsidian className="w-4 h-4" data-icon />
              Obsidian
            </ContextMenuItem>
            <ContextMenuItem className="app-context-menu-item" onClick={() => onAddTemplate(brain.id, 'webclipper')}>
              <Icons.globe className="w-4 h-4" data-icon />
              WebClipper
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem className="app-context-menu-item destructive" onClick={() => onDelete(brain.id)}>
          <Icons.trash className="w-4 h-4" data-icon />
          Delete Brain
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
