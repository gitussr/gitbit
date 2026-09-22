import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './IconButton'
import { ProgressRing } from './ProgressRing'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /**
   * 0-100 reading progress through the current page. When given, the ring
   * shows this instead of page position — the `page / totalPages` label
   * beside it already carries that, and two rings would just be noise
   * (Section 21). Leave it out on a page with little to scroll and the ring
   * goes back to showing position in the set.
   */
  progress?: number
  className?: string
}

/**
 * Floating prev/next control with a subtle progress ring (Section 16, 21).
 * Sits inline by default; pass a `fixed`/`bottom-*` className at the call
 * site to pin it as a floating reading-progress bar (see ConceptPage).
 */
export function Pagination({ page, totalPages, onPageChange, progress, className }: PaginationProps) {
  return (
    <nav
      aria-label="Pagination"
      className={cn('glass inline-flex items-center gap-1.5 p-1 shadow-brutal-sm', className)}
    >
      <IconButton
        icon={<ChevronLeft aria-hidden="true" />}
        label="Previous"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <ProgressRing
        value={progress ?? (page / totalPages) * 100}
        size={28}
        strokeWidth={2.5}
        animate={progress === undefined}
        label={
          progress === undefined
            ? `Page ${page} of ${totalPages}`
            : `${Math.round(progress)}% through this page`
        }
      />
      <span className="px-1 font-mono text-xs font-bold text-foreground">
        {page} / {totalPages}
      </span>
      <IconButton
        icon={<ChevronRight aria-hidden="true" />}
        label="Next"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  )
}
