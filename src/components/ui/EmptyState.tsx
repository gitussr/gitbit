import type { ElementType, ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  /**
   * `h1` where the empty state *is* the page — a not-found route otherwise
   * renders no heading at all, leaving the document without one (Section 24).
   * Stays `p` for an empty state sitting inside a page that has its own h1.
   */
  titleAs?: Extract<ElementType, 'p' | 'h1' | 'h2'>
}

export function EmptyState({ icon, title, description, action, titleAs: Title = 'p' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 border-2 border-dashed border-accent px-5 py-10 text-center">
      {icon && <div className="text-foreground-tertiary">{icon}</div>}
      <div className="flex flex-col gap-1">
        <Title className="text-sm font-semibold text-foreground">{title}</Title>
        {description && <p className="text-sm text-foreground-tertiary">{description}</p>}
      </div>
      {action}
    </div>
  )
}
