import { useParams } from 'react-router-dom'
import { comparisons, getComparisonBySlug, getCommandByName } from '@/services/content'
import type { ComparisonSide } from '@/components/ui/ComparisonSplit'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ComparisonSplit } from '@/components/ui/ComparisonSplit'
import { Heading, Text } from '@/components/ui/Typography'
import { EmptyState } from '@/components/ui/EmptyState'
import { ComparisonCard } from '@/components/cards'

/** Links a side to its Quick page when the command is one GitBit documents. */
function resolveSide(side: { command: string; plainEnglish: string }): ComparisonSide {
  const command = getCommandByName(side.command)
  return { ...side, to: command ? `/quick/${command.slug}` : undefined }
}

export default function CompareDetailPage() {
  const { slug } = useParams()
  const comparison = slug ? getComparisonBySlug(slug) : undefined

  if (!comparison) {
    return <EmptyState title="Comparison not found" description="GitBit doesn't compare those two commands yet." />
  }

  const others = comparisons.filter((item) => item.slug !== comparison.slug)

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Breadcrumbs items={[{ label: 'Compare', to: '/compare' }, { label: comparison.title }]} />

      <Heading level={1} size={2} className="font-mono">
        {comparison.title}
      </Heading>

      <ComparisonSplit left={resolveSide(comparison.left)} right={resolveSide(comparison.right)} />

      <div className="flex flex-col gap-1">
        <Heading level={2} size={4}>
          The difference
        </Heading>
        <Text tone="secondary">{comparison.explanation}</Text>
      </div>

      {others.length > 0 && (
        <div className="flex flex-col gap-2">
          <Heading level={2} size={4}>
            Other easily-confused pairs
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            {others.map((item) => (
              <ComparisonCard key={item.slug} comparison={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
