import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface ChipLinkProps extends Omit<LinkProps, 'className'> {
  /** Monospace, for a Git command rather than a concept name. */
  code?: boolean
  className?: string
}

/**
 * Visual classes shared by `ChipLink` and any element that must look like a
 * chip without being a link (mirrors `cardClassName`) — `interactive` adds the
 * hover treatment, so a static chip doesn't promise a click it can't deliver.
 */
export function chipClassName({ code = false, interactive = true, className }: { code?: boolean; interactive?: boolean; className?: string } = {}) {
  return cn(
    'inline-flex h-7 items-center border-2 border-accent bg-surface px-2 text-body-sm font-semibold text-foreground',
    interactive && 'transition-colors duration-150 ease-standard hover:bg-accent-subtle',
    code && 'bg-code-bg font-mono text-code-text',
    code && interactive && 'hover:bg-feature-hover',
    className,
  )
}

/** A small square link to a related concept or command. */
export function ChipLink({ className, code = false, ...props }: ChipLinkProps) {
  return <Link className={chipClassName({ code, className })} {...props} />
}
