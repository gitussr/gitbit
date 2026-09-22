import { Link } from 'react-router-dom'
import { GitCompareArrows } from 'lucide-react'
import type { Comparison } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { Text } from '@/components/ui/Typography'

/**
 * A confusable command pair in a grid (Section 30). The card states the pair
 * and why it's confusing; the side-by-side split is the detail page's job,
 * since it needs room to give both sides equal weight.
 */
export function ComparisonCard({ comparison }: { comparison: Comparison }) {
  return (
    <Link to={`/compare/${comparison.slug}`} className={cardClassName(true, 'flex gap-3')}>
      <GitCompareArrows className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <Text as="p" className="font-mono font-semibold">
          {comparison.title}
        </Text>
        <Text variant="body-sm" tone="secondary" className="line-clamp-3">
          {comparison.explanation}
        </Text>
      </div>
    </Link>
  )
}
