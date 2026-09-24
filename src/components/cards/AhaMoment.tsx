import { ArrowRight, Lightbulb } from 'lucide-react'
import type { AhaCard } from '@/content/types'
import { Card } from '@/components/ui/Card'
import { ChipLink } from '@/components/ui/ChipLink'
import { Text } from '@/components/ui/Typography'

/**
 * An Aha card surfacing in context (Visualizer Section 25) — the moment
 * the thing it explains has just happened on screen.
 *
 * `AhaTile` is the same card as a link in a grid; this one carries the
 * explanation too, because here it's being read, not browsed. The picture
 * an Aha card normally comes with is left out: the stage beside it *is*
 * the picture.
 */
export function AhaMoment({ aha }: { aha: AhaCard }) {
  return (
    <Card className="flex flex-col gap-2 p-3.5">
      <Text variant="caption" className="inline-flex items-center gap-1.5 font-bold uppercase">
        <Lightbulb className="size-4 text-accent-strong" aria-hidden="true" />
        Aha!
      </Text>
      <Text className="font-semibold">{aha.statement}</Text>
      <Text variant="body-sm" tone="secondary">
        {aha.explanation}
      </Text>
      <ChipLink to={`/aha/${aha.slug}`} className="gap-1 self-start">
        More in GitBit Aha
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </ChipLink>
    </Card>
  )
}
