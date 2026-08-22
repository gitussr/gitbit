import { cn } from '@/utils/cn'

/**
 * Basic wordmark (Section 22). Deliberately simple for the MVP — swap
 * this single component to roll out a real logo/icon system later.
 */
export function GitBitLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-base font-semibold text-foreground', className)}>
      <span className="inline-flex size-6 items-center justify-center rounded-md bg-accent font-mono text-xs text-foreground-inverse">
        {'{}'}
      </span>
      GitBit
    </span>
  )
}
