import { LifeBuoy } from 'lucide-react'
import { sosGuides } from '@/services/content'
import { Heading, Text } from '@/components/ui/Typography'
import { SosCard } from '@/components/cards'

export default function SosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <LifeBuoy className="mt-1 size-7 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <Heading level={1}>GitBit SOS</Heading>
          <Text tone="secondary" className="mt-2">
            "I messed up Git." Find your situation below — nothing here is as bad as it feels.
          </Text>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sosGuides.map((guide) => (
          <SosCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </div>
  )
}
