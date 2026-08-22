import { Link } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import type { AhaCard } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'

/** Highly visual — GitBit Aha statements should read like a poster, not a list item (Section 4). */
export function AhaTile({ aha }: { aha: AhaCard }) {
  return (
    <Link
      to={`/aha/${aha.slug}`}
      className={cardClassName(true, 'flex flex-col gap-4 bg-accent-subtle border-accent-border')}
    >
      <Lightbulb className="size-6 text-accent-strong" aria-hidden="true" />
      <p className="text-lg leading-snug font-semibold text-foreground">{aha.statement}</p>
    </Link>
  )
}
