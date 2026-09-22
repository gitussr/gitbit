import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/** A single keycap — the one place a shortcut hint's styling is defined. */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex shrink-0 items-center border-2 border-accent bg-background-subtle px-1.5 py-0.5 font-mono text-[11px] text-foreground-secondary',
        className,
      )}
      {...props}
    />
  )
}
