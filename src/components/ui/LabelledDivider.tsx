import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface LabelledDividerProps {
  children: ReactNode
  /** Dashed says "a boundary between two places", not just a section break. */
  dashed?: boolean
  className?: string
}

/**
 * A line with a name on it. In the Visualizer it separates your machine
 * from the remote (Section 22): the remote is a different place, and the
 * boundary is drawn so pushes and fetches visibly cross something.
 */
export function LabelledDivider({ children, dashed = false, className }: LabelledDividerProps) {
  const line = cn('h-0 flex-1 border-t-2 border-accent', dashed && 'border-dashed')
  return (
    <div className={cn('flex items-center gap-3', className)} role="separator">
      <span className={line} />
      <span className="text-xs font-bold tracking-wide text-foreground-secondary uppercase">{children}</span>
      <span className={line} />
    </div>
  )
}
