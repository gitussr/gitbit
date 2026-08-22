import { Link, useNavigate, useParams } from 'react-router-dom'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { ahaCards, getAhaBySlug, getConceptBySlug, getLevelForConcept } from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cardClassName } from '@/components/ui/Card'

export default function AhaDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const aha = slug ? getAhaBySlug(slug) : undefined

  if (!aha) {
    return <EmptyState title="Aha not found" description="That one isn't in GitBit Aha yet." />
  }

  const index = ahaCards.findIndex((a) => a.slug === aha.slug)
  const next = ahaCards[(index + 1) % ahaCards.length]

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <Breadcrumbs items={[{ label: 'Aha', to: '/aha' }, { label: aha.statement }]} />

      <div className="flex flex-col gap-4 rounded-xl border border-accent-border bg-accent-subtle p-8">
        <Lightbulb className="size-8 text-accent-strong" aria-hidden="true" />
        <Heading level={1} size={2} className="leading-snug">
          {aha.statement}
        </Heading>
      </div>

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
              <Link key={slug} to={level ? `/learn/${level.slug}/${concept.slug}` : '/learn'} className={cardClassName(true, 'px-3 py-1.5 text-sm')}>
                {concept.term}
              </Link>
            )
          })}
        </div>
      )}

      <Button variant="secondary" trailingIcon={<ArrowRight aria-hidden="true" />} onClick={() => navigate(`/aha/${next.slug}`)} className="self-start">
        Next Aha
      </Button>
    </div>
  )
}
