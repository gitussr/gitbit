import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 border-2 border-dashed border-accent px-5 py-10 text-center">
      {icon && <div className="text-foreground-tertiary">{icon}</div>}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-foreground-tertiary">{description}</p>}
      </div>
      {action}
    </div>
  )
}
