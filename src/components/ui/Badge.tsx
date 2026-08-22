import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import type { DangerLevel } from '@/content/types'

export type BadgeVariant = 'neutral' | 'accent' | 'safe' | 'caution' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-background-subtle text-foreground-secondary border-border',
  accent: 'bg-accent-subtle text-accent-strong border-accent-border',
  safe: 'bg-safe-subtle text-safe border-safe-border',
  caution: 'bg-caution-subtle text-caution border-caution-border',
  danger: 'bg-danger-subtle text-danger border-danger-border',
}

/** A small status/category label. Used directly, and to render danger levels via `dangerLevelToBadgeVariant`. */
export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
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
