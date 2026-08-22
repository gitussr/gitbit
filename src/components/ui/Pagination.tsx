import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './IconButton'
import { ProgressRing } from './ProgressRing'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/** Floating, frosted-glass prev/next control with a subtle progress ring (Section 16, 21). */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  return (
    <nav
      aria-label="Pagination"
      className={cn('glass inline-flex items-center gap-1.5 rounded-full p-1.5 shadow-sm', className)}
    >
      <IconButton
        icon={<ChevronLeft aria-hidden="true" />}
        label="Previous"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <ProgressRing value={(page / totalPages) * 100} size={28} strokeWidth={2.5} label={`Page ${page} of ${totalPages}`} />
      <span className="px-1 font-mono text-xs text-foreground-secondary">
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
