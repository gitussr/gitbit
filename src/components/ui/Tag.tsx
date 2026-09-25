import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** A filter/selector chip — e.g. category or difficulty filters in GitBit Quick. Selected reads as an ink chip, like code. */
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
        'inline-flex h-8 items-center border-2 border-accent px-3 text-body-sm font-bold transition-colors duration-150 ease-standard',
        selected ? 'bg-accent text-on-accent' : 'bg-surface text-foreground hover:bg-accent-subtle',
        className,
      )}
      {...props}
    />
  )
})
