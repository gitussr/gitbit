import { comparisons } from '@/services/content'
import { PageHeader } from '@/components/ui/PageHeader'
import { ComparisonCard } from '@/components/cards'

export default function ComparePage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="GitBit Compare"
        description={'Commands that sound alike, side by side — what each one actually does, and which you want.'}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comparisons.map((comparison) => (
          <ComparisonCard key={comparison.slug} comparison={comparison} />
        ))}
      </div>
    </div>
  )
}
