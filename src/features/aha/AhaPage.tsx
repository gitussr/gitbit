import { ahaCards } from '@/services/content'
import { PageHeader } from '@/components/ui/PageHeader'
import { AhaTile } from '@/components/cards'

export default function AhaPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="GitBit Aha" description={'Short ideas that quietly fix a wrong mental model.'} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ahaCards.map((aha) => (
          <AhaTile key={aha.slug} aha={aha} />
        ))}
      </div>
    </div>
  )
}
