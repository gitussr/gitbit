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
  current: 'border-solid bg-highlight text-highlight-ink',
  head: 'border-solid bg-highlight text-highlight-ink',
  remote: 'border-dashed bg-surface text-foreground-secondary',
}

export interface BranchLabelProps {
  name: string
  variant?: BranchLabelVariant
  className?: string
}

/** A ref, as the history graph draws it next to the commit it points at. */
export function BranchLabel({ name, variant = 'branch', className }: BranchLabelProps) {
  return (
    <span
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
}
