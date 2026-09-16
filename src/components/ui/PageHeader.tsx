import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Heading, Text } from './Typography'

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Small label above the title — e.g. a level number or category badge. */
  eyebrow?: ReactNode
  className?: string
}

/** The one page title block (h1 + lead), so every page opens with the same rhythm. */
export function PageHeader({ title, description, eyebrow, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col items-start gap-1.5', className)}>
      {eyebrow}
      <Heading level={1}>{title}</Heading>
      {description && (
        <Text variant="body-lg" tone="secondary" className="max-w-2xl">
          {description}
        </Text>
      )}
    </div>
  )
}
