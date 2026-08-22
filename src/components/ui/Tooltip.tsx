import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TooltipProps {
  content: ReactNode
  children: ReactElement
  side?: 'top' | 'bottom'
}

/** CSS-only tooltip (no positioning library) — reveals on hover and keyboard focus alike. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const id = useId()

  return (
    <span className="group/tooltip relative inline-flex">
      {isValidElement(children) ? cloneElement(children, { 'aria-describedby': id } as Record<string, unknown>) : children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-tooltip w-max max-w-56 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground opacity-0 shadow-md transition-opacity duration-150',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          side === 'top' ? 'bottom-full left-1/2 mb-2 -translate-x-1/2' : 'top-full left-1/2 mt-2 -translate-x-1/2',
        )}
      >
        {content}
      </span>
    </span>
  )
}
