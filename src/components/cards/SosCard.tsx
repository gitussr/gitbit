import { Link } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import type { SosGuide } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { DangerBadge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Typography'

export function SosCard({ guide }: { guide: SosGuide }) {
  return (
    <Link to={`/sos/${guide.slug}`} className={cardClassName(true, 'flex gap-3')}>
      <LifeBuoy className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <Text as="p" className="font-semibold">
          {guide.situation}
        </Text>
        <Text variant="body-sm" tone="secondary" className="line-clamp-2">
          {guide.reassurance}
        </Text>
        <DangerBadge level={guide.dangerLevel} />
      </div>
    </Link>
  )
}
