import { sosGuides } from '@/services/content'
import { PageHeader } from '@/components/ui/PageHeader'
import { SosCard } from '@/components/cards'

export default function SosPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="GitBit SOS"
        description={'"I messed up Git." Find your situation below — nothing here is as bad as it feels.'}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sosGuides.map((guide) => (
          <SosCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </div>
  )
}
