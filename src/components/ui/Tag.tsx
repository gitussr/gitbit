import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** A filter/selector chip — e.g. category or difficulty filters in GitBit Quick. */
export const Tag = forwardRef<HTMLButtonElement, TagProps>(function Tag(
  { className, selected = false, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors duration-150 ease-standard',
        selected
          ? 'bg-accent text-foreground-inverse border-accent'
          : 'bg-surface text-foreground-secondary border-border hover:bg-surface-hover hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
})
