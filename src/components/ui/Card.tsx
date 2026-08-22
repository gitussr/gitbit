import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

/** Visual classes shared by `Card` and any element (e.g. a `Link`) that needs to look like one. */
export function cardClassName(interactive = false, className?: string) {
  return cn(
    'rounded-lg border border-border bg-surface p-5 shadow-xs',
    interactive &&
      'transition-[border-color,box-shadow,transform] duration-200 ease-standard hover:border-border-strong hover:shadow-sm hover:-translate-y-0.5',
    className,
  )
}

/** Generic surface primitive every content card composes with. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, ...props },
  ref,
) {
  return <div ref={ref} className={cardClassName(interactive, className)} {...props} />
})
