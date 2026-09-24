import { Check, File, FilePlus, FileWarning, FileX, Pencil } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/utils/cn'

/**
 * How a file appears in one of the Visualizer's state panels.
 *
 * Deliberately about *appearance*, not about Git: the panel decides which
 * status a file has, this decides what that looks like. Keeping the
 * primitive ignorant of Git is what lets Learn reuse it later.
 */
export type FileNodeStatus = 'untracked' | 'modified' | 'staged' | 'deleted' | 'unchanged' | 'conflicted' | 'added'

const statusMeta: Record<FileNodeStatus, { icon: ComponentType<{ className?: string }>; label: string; className: string }> = {
  untracked: { icon: FilePlus, label: 'untracked', className: 'bg-surface' },
  modified: { icon: Pencil, label: 'modified', className: 'bg-caution-subtle' },
  staged: { icon: Check, label: 'staged', className: 'bg-safe-subtle' },
  deleted: { icon: FileX, label: 'deleted', className: 'bg-danger-subtle' },
  unchanged: { icon: File, label: 'unchanged', className: 'bg-surface' },
  // A file a commit introduced — used when looking at a snapshot, where
  // "untracked" would be false: a committed file is tracked by definition.
  added: { icon: FilePlus, label: 'added', className: 'bg-safe-subtle' },
  // Danger fill with a dashed edge, so it can't be mistaken for `deleted` in
  // greyscale either: this file is waiting on a decision, not gone.
  conflicted: { icon: FileWarning, label: 'conflict', className: 'border-dashed bg-danger-subtle' },
}

export interface FileNodeProps {
  path: string
  status?: FileNodeStatus
  /**
   * Plays the entrance when the file has just arrived here. The caller
   * decides — under reduced motion it simply doesn't ask for one, and the
   * node renders in its final position.
   */
  entering?: boolean
  /** Makes the row a button — e.g. to show this file's history. */
  onSelect?: () => void
  selected?: boolean
  className?: string
}

/** A file status as a small square — the same fill, edge and icon as the row. For a legend (Section 31). */
export function FileStatusSwatch({ status, className }: { status: FileNodeStatus; className?: string }) {
  const meta = statusMeta[status]
  const Icon = meta.icon
  return (
    <span aria-hidden="true" className={cn('inline-flex size-6 shrink-0 items-center justify-center border-2 border-accent', meta.className, className)}>
      <Icon className="size-3.5" />
    </span>
  )
}

/** One file, in one place. The unit that moves between panels (Section 11). */
export function FileNode({ path, status = 'unchanged', entering = false, onSelect, selected = false, className }: FileNodeProps) {
  const meta = statusMeta[status]
  const Icon = meta.icon

  const content = (
    <>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate font-mono text-body-sm">{path}</span>
      {/* The status in words, visible and readable — colour and icon carry the
          same fact for people who can see it, so nothing needs an sr-only twin. */}
      <span className="ml-auto text-xs font-bold text-foreground-secondary">{meta.label}</span>
    </>
  )

  const row = 'flex items-center gap-2 px-2 py-1.5'

  return (
    <li
      className={cn(
        'border-2 border-accent',
        meta.className,
        selected && 'outline-2 outline-offset-2 outline-accent',
        entering && 'motion-safe:animate-viz-drop',
        !onSelect && row,
        className,
      )}
    >
      {onSelect ? (
        <button type="button" onClick={onSelect} aria-pressed={selected} className={cn(row, 'w-full text-left')}>
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  )
}
