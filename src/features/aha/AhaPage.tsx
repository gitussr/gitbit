import { ahaCards } from '@/services/content'
import { Heading, Text } from '@/components/ui/Typography'
import { AhaTile } from '@/components/cards'

export default function AhaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={1}>GitBit Aha</Heading>
        <Text tone="secondary" className="mt-2">
          Short ideas that quietly fix a wrong mental model.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ahaCards.map((aha) => (
          <AhaTile key={aha.slug} aha={aha} />
        ))}
      </div>
    </div>
  )
}
