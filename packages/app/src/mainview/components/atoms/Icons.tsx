import {
  Brain, FolderOpen, HardDrive, FileText, Settings, Trash2,
  Cloud, CloudOff, Plus, Download, MoreVertical, Moon, Sun,
  Globe, Loader2, CheckCircle2, Check, XCircle, HelpCircle, File,
  Wrench, Lightbulb, BookOpen, Briefcase, Home, ChevronLeft
} from 'lucide-react'
import { SiObsidian } from 'react-icons/si'
import { TbRobot, TbSparkles, TbFlask, TbDna, TbCpu } from 'react-icons/tb'
import type { ComponentType, SVGProps } from 'react'

export const Icons = {
  brain: Brain,
  folder: FolderOpen,
  drive: HardDrive,
  file: FileText,
  fileText: File,
  settings: Settings,
  trash: Trash2,
  cloud: Cloud,
  cloudOff: CloudOff,
  plus: Plus,
  download: Download,
  more: MoreVertical,
  moon: Moon,
  sun: Sun,
  globe: Globe,
  loader: Loader2,
  checkCircle: CheckCircle2,
  check: Check,
  xCircle: XCircle,
  helpCircle: HelpCircle,
  wrench: Wrench,
  obsidian: SiObsidian,
  chevronLeft: ChevronLeft
}

export type BrainIconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

export interface BrainIconOption {
  key: string
  label: string
  component: BrainIconComponent
}

export const BRAIN_ICON_OPTIONS: BrainIconOption[] = [
  { key: 'brain',     label: 'Brain',     component: Brain as BrainIconComponent },
  { key: 'lightbulb', label: 'Lightbulb', component: Lightbulb as BrainIconComponent },
  { key: 'bookOpen',  label: 'Book',      component: BookOpen as BrainIconComponent },
  { key: 'briefcase', label: 'Briefcase', component: Briefcase as BrainIconComponent },
  { key: 'home',      label: 'Home',      component: Home as BrainIconComponent },
  { key: 'robot',     label: 'Robot',     component: TbRobot as BrainIconComponent },
  { key: 'sparkles',  label: 'Sparkles',  component: TbSparkles as BrainIconComponent },
  { key: 'flask',     label: 'Flask',     component: TbFlask as BrainIconComponent },
  { key: 'dna',       label: 'DNA',       component: TbDna as BrainIconComponent },
  { key: 'cpu',       label: 'CPU',       component: TbCpu as BrainIconComponent },
]

export const DEFAULT_BRAIN_ICON  = 'brain'
export const DEFAULT_BRAIN_COLOR = '#a187e3'

export function getBrainIcon(key?: string): BrainIconComponent {
  return (
    BRAIN_ICON_OPTIONS.find(o => o.key === key)?.component ??
    (Brain as BrainIconComponent)
  )
}
