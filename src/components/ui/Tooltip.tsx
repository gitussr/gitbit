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
          'pointer-events-none absolute z-tooltip w-max max-w-56 border-2 border-accent bg-surface px-2 py-1 text-xs font-semibold text-foreground opacity-0 shadow-brutal-sm transition-opacity duration-150',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          side === 'top' ? 'bottom-full left-1/2 mb-2 -translate-x-1/2' : 'top-full left-1/2 mt-2 -translate-x-1/2',
        )}
      >
        {content}
      </span>
    </span>
  )
}
