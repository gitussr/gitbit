import { cn } from '@/utils/cn'
import { Badge } from './Badge'
import { Text } from './Typography'

export interface CommitNodeProps {
  id: string
  message: string
  /** Marks where HEAD is. The full HEAD treatment (Section 14) comes with branches. */
  isHead?: boolean
  /** The first commit in the repository — it has no parent, and that is worth seeing. */
  isRoot?: boolean
  entering?: boolean
  className?: string
}

/**
 * One recorded snapshot (Section 24).
 *
 * The filled circle is the commit itself; the short id beside it is the
 * name Git gave it. Both matter — a beginner who never sees a hash has no
 * way to connect the picture to `git log`.
 */
export function CommitNode({ id, message, isHead = false, isRoot = false, entering = false, className }: CommitNodeProps) {
  return (
    <li
      className={cn(
        'flex items-center gap-2.5 border-2 border-accent bg-surface px-2 py-1.5',
        entering && 'motion-safe:animate-viz-drop',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-[var(--viz-node)] shrink-0 rounded-full border-2 border-accent bg-accent"
      />
      <span className="font-mono text-body-sm font-bold">{id}</span>
      <Text variant="body-sm" className="min-w-0 flex-1 truncate">
        {message}
      </Text>
      {isRoot && <Badge variant="neutral">root</Badge>}
      {isHead && <Badge variant="highlight">HEAD</Badge>}
    </li>
  )
}
