import { Link } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import type { SosGuide } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { DangerBadge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'

export function SosCard({ guide }: { guide: SosGuide }) {
  return (
    <Link to={`/sos/${guide.slug}`} className={cardClassName(true, 'flex flex-col gap-3')}>
      <div className="flex items-start justify-between gap-2">
        <LifeBuoy className="size-5 text-accent" aria-hidden="true" />
        <DangerBadge level={guide.dangerLevel} />
      </div>
      <Heading level={4} as="p" className="text-base">
        {guide.situation}
      </Heading>
      <Text variant="body-sm" tone="secondary" className="line-clamp-2">
        {guide.reassurance}
      </Text>
    </Link>
  )
}
