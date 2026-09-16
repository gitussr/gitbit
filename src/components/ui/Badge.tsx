import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import type { DangerLevel } from '@/content/types'

export type BadgeVariant = 'neutral' | 'accent' | 'highlight' | 'safe' | 'caution' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-surface text-foreground border-accent',
  /** An ink chip with light text — the same treatment as code. */
  accent: 'bg-accent text-feature-text border-accent',
  /** Lime fill with dark ink — reads on any ground. Sparingly: "new", "today". */
  highlight: 'bg-highlight text-highlight-ink border-accent',
  safe: 'bg-safe-subtle text-foreground border-safe-border',
  caution: 'bg-caution-subtle text-foreground border-caution-border',
  danger: 'bg-danger-subtle text-foreground border-danger-border',
}

/** A small status/category label. Used directly, and to render danger levels via `dangerLevelToBadgeVariant`. */
export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border-2 px-1.5 text-xs leading-5 font-bold whitespace-nowrap',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  )
}

const dangerLevelVariant: Record<DangerLevel, BadgeVariant> = {
  safe: 'safe',
  caution: 'caution',
  'high-caution': 'danger',
}

const dangerLevelLabel: Record<DangerLevel, string> = {
  safe: 'Safe / everyday',
  caution: 'Understand before using',
  'high-caution': 'High caution',
}

/** Maps a content `DangerLevel` to its Badge variant + human label (Section 31). */
export function DangerBadge({ level, className }: { level: DangerLevel; className?: string }) {
  return (
    <Badge variant={dangerLevelVariant[level]} className={className}>
      {dangerLevelLabel[level]}
    </Badge>
  )
}
