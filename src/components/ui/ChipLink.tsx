import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface ChipLinkProps extends Omit<LinkProps, 'className'> {
  /** Monospace, for a Git command rather than a concept name. */
  code?: boolean
  className?: string
}

/** A small square link to a related concept or command. */
export function ChipLink({ className, code = false, ...props }: ChipLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex h-7 items-center border-2 border-accent bg-surface px-2 text-body-sm font-semibold text-foreground',
        'transition-colors duration-150 ease-standard hover:bg-accent-subtle',
        code && 'bg-code-bg font-mono text-code-text hover:bg-feature-hover',
        className,
      )}
      {...props}
    />
  )
}
