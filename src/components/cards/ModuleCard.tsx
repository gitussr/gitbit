import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { cardClassName } from '@/components/ui/Card'
import { Text } from '@/components/ui/Typography'

export interface ModuleCardProps {
  to: string
  icon: LucideIcon
  title: string
  description: string
}

/** A GitBit module entry point (home page): icon beside the text rather than above it, so eight fit on one phone screen. */
export function ModuleCard({ to, icon: Icon, title, description }: ModuleCardProps) {
  return (
    <Link to={to} className={cardClassName(true, 'group flex items-center gap-3 p-3')}>
      <span className="flex size-9 shrink-0 items-center justify-center bg-accent text-on-accent">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Text as="span" className="font-semibold">
          {title}
        </Text>
        <Text as="span" variant="body-sm" tone="secondary">
          {description}
        </Text>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-foreground-tertiary transition-transform duration-200 ease-standard group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  )
}
