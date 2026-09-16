import { Link } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import type { AhaCard } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { Text } from '@/components/ui/Typography'

/** GitBit Aha statements read like a poster, not a list item (Section 4) — kept compact so a grid still scans. */
export function AhaTile({ aha }: { aha: AhaCard }) {
  return (
    <Link to={`/aha/${aha.slug}`} className={cardClassName(true, 'flex gap-3', 'accent')}>
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden="true" />
      <Text as="p" variant="body-lg" className="font-semibold">
        {aha.statement}
      </Text>
    </Link>
  )
}
