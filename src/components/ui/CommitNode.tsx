import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Badge } from './Badge'
import { Text } from './Typography'

export interface CommitNodeProps {
  id: string
  message: string
  /** The first commit in the repository — it has no parent, and that is worth seeing. */
  isRoot?: boolean
  /** Branch labels pointing here (`BranchLabel`s). */
  refs?: ReactNode
  /** Words for what the graph's lines show, e.g. "built on 3f2a1bc". Read by screen readers only. */
  lineage?: string
  className?: string
}

/**
 * One recorded snapshot (Section 24), as a row of the history graph.
 *
 * The graph draws the node itself; this is what sits beside it. The short
 * id matters as much as the message — a beginner who never sees a hash has
 * no way to connect the picture to `git log`.
 */
export function CommitNode({ id, message, isRoot = false, refs, lineage, className }: CommitNodeProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2', className)}>
      <span className="font-mono text-body-sm font-bold">{id}</span>
      {refs}
      <Text variant="body-sm" className="min-w-0 flex-1 truncate">
        {message}
      </Text>
      {lineage && <span className="sr-only">{lineage}</span>}
      {isRoot && <Badge variant="neutral">root</Badge>}
    </div>
  )
}
