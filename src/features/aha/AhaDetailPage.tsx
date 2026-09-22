import { useParams } from 'react-router-dom'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { ahaCards, getAhaBySlug, getConceptBySlug, getLevelForConcept } from '@/services/content'
import { AhaVisualView } from '@/components/AhaVisualView'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChipLink } from '@/components/ui/ChipLink'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AhaDetailPage() {
  const { slug } = useParams()
  const aha = slug ? getAhaBySlug(slug) : undefined

  if (!aha) {
    return <EmptyState titleAs="h1" title="Aha not found" description="That one isn't in GitBit Aha yet." />
  }

  const index = ahaCards.findIndex((a) => a.slug === aha.slug)
  const next = ahaCards[(index + 1) % ahaCards.length]

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Breadcrumbs items={[{ label: 'Aha', to: '/aha' }, { label: aha.statement }]} />

      <Card variant="accent" className="flex flex-col gap-2.5 p-5">
        <Lightbulb className="size-5 text-accent-strong" aria-hidden="true" />
        <Heading level={1} size={2}>
          {aha.statement}
        </Heading>
      </Card>

      {aha.visual && <AhaVisualView visual={aha.visual} />}

      <Text variant="body-lg" tone="secondary">
        {aha.explanation}
      </Text>

      {aha.relatedConcepts && aha.relatedConcepts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {aha.relatedConcepts.map((slug) => {
            const concept = getConceptBySlug(slug)
            if (!concept) return null
            const level = getLevelForConcept(concept.slug)
            return (
              <ChipLink key={slug} to={level ? `/learn/${level.slug}/${concept.slug}` : '/learn'}>
                {concept.term}
              </ChipLink>
            )
          })}
        </div>
      )}

      <ButtonLink
        to={`/aha/${next.slug}`}
        variant="secondary"
        trailingIcon={<ArrowRight aria-hidden="true" />}
        className="self-start"
      >
        Next Aha
      </ButtonLink>
    </div>
  )
}
