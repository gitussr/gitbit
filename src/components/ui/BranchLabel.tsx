import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * - `branch`: a local branch — a name pointing at a commit.
 * - `current`: the branch HEAD is on. Drawn as `HEAD → main`, because
 *   "which branch am I on" and "where is HEAD" are the same question, and
 *   showing them as one label is what makes that visible (Section 14).
 * - `head`: HEAD on its own, pointing straight at a commit (detached).
 *   Pass `name="HEAD"`.
 * - `remote`: a remote-tracking ref like `origin/main`. Dashed, because it
 *   is a record of where the remote was when you last looked — not a
 *   place you can commit to.
 */
export type BranchLabelVariant = 'branch' | 'current' | 'head' | 'remote'

const variantStyles: Record<BranchLabelVariant, string> = {
  branch: 'border-solid bg-surface text-foreground',
  // Ink with lime text, not lime: the panel HEAD lives in turns lime when
  // something lands in it, and HEAD must be the thing that stays visible then.
  current: 'border-solid bg-accent text-highlight',
  head: 'border-solid bg-accent text-highlight',
  remote: 'border-dashed bg-surface text-foreground-secondary',
}

export interface BranchLabelProps {
  name: string
  variant?: BranchLabelVariant
  className?: string
}

/**
 * A ref, as the history graph draws it next to the commit it points at.
 * Forwards its ref so the graph can make HEAD's label travel when it moves.
 */
export const BranchLabel = forwardRef<HTMLSpanElement, BranchLabelProps>(function BranchLabel(
  { name, variant = 'branch', className },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 border-2 border-accent px-1.5 font-mono text-xs leading-5 font-bold whitespace-nowrap',
        variantStyles[variant],
        className,
      )}
    >
      {variant === 'current' && (
        <>
          HEAD<span aria-hidden="true">→</span>
          <span className="sr-only">points to</span>
        </>
      )}
      {name}
    </span>
  )
})
