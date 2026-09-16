import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * Every card is lime with a 2px ink border and the hard ink shadow — the
 * reference design, used site-wide. `feature` inverts it (ink ground,
 * white/lime text) and is for non-card bands like the home hero. `accent`
 * is kept as an alias of `default` so existing call sites stay valid.
 */
export type CardVariant = 'default' | 'accent' | 'feature'

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-card text-foreground',
  accent: 'bg-card text-foreground',
  feature: 'bg-feature text-feature-text',
}

/**
 * Hover presses the card toward its shadow: it moves by exactly the shadow
 * it loses (7.778px -> 3px), so the shadow's outer corner stays put and the
 * card reads as pushed in rather than sliding around.
 */
const interactiveStyles =
  'transition-[transform,box-shadow] duration-150 ease-standard hover:-translate-x-[4.778px] hover:translate-y-[4.778px] hover:shadow-brutal-pressed active:-translate-x-[7.778px] active:translate-y-[7.778px] active:shadow-none'

/** Visual classes shared by `Card` and any element (e.g. a `Link`) that needs to look like one. */
export function cardClassName(interactive = false, className?: string, variant: CardVariant = 'default') {
  return cn(
    // min-w-0: as a grid/flex item a card would otherwise refuse to shrink below a truncated line and widen the page.
    'min-w-0 border-2 border-accent p-4 shadow-brutal',
    variantStyles[variant],
    interactive && interactiveStyles,
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
