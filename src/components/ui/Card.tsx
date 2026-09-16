import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * `feature` is the always-dark brand ground — the only card lime text may
 * sit on. Use it once per view, for the thing that matters most (today's
 * bit, the featured Aha); everything else is `default`.
 */
export type CardVariant = 'default' | 'accent' | 'feature'

const variantStyles: Record<CardVariant, string> = {
  default: 'border-border bg-surface shadow-xs',
  accent: 'border-accent-border bg-accent-subtle',
  feature: 'border-feature-border bg-feature text-feature-text shadow-sm',
}

const interactiveStyles: Record<CardVariant, string> = {
  default: 'hover:border-border-strong hover:shadow-sm',
  accent: 'hover:border-accent',
  feature: 'hover:bg-feature-hover',
}

/** Visual classes shared by `Card` and any element (e.g. a `Link`) that needs to look like one. */
export function cardClassName(interactive = false, className?: string, variant: CardVariant = 'default') {
  return cn(
    // min-w-0: as a grid/flex item a card would otherwise refuse to shrink below a truncated line and widen the page.
    'min-w-0 rounded-lg border p-4',
    variantStyles[variant],
    interactive && ['transition-[background-color,border-color,box-shadow] duration-200 ease-standard', interactiveStyles[variant]],
    className,
  )
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  variant?: CardVariant
}

/** Generic surface primitive every content card composes with. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, variant = 'default', ...props },
  ref,
) {
  return <div ref={ref} className={cardClassName(interactive, className, variant)} {...props} />
})
