import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface ChipLinkProps extends Omit<LinkProps, 'className'> {
  /** Monospace, for a Git command rather than a concept name. */
  code?: boolean
  className?: string
}

/** A small pill link to a related concept or command. */
export function ChipLink({ className, code = false, ...props }: ChipLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex h-7 items-center rounded-full border border-border bg-surface px-2.5 text-body-sm font-medium text-foreground',
        'transition-colors duration-150 ease-standard hover:border-accent-border hover:bg-accent-subtle hover:text-accent-strong',
        code && 'font-mono',
        className,
      )}
      {...props}
    />
  )
}
