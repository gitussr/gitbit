import { useParams } from 'react-router-dom'
import { getSosBySlug, getConceptBySlug, getLevelForConcept } from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { DangerBadge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { CommandBlock } from '@/components/ui/CommandBlock'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChipLink } from '@/components/ui/ChipLink'

export default function SosDetailPage() {
  const { slug } = useParams()
  const guide = slug ? getSosBySlug(slug) : undefined

  if (!guide) {
    return <EmptyState titleAs="h1" title="Guide not found" description="That situation isn't in GitBit SOS yet." />
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Breadcrumbs items={[{ label: 'SOS', to: '/sos' }, { label: guide.situation }]} />

      <div className="flex flex-col items-start gap-2">
        <DangerBadge level={guide.dangerLevel} />
        <Heading level={1} size={2}>
          {guide.situation}
        </Heading>
      </div>

      <Alert variant="success" title="You're okay">
        {guide.reassurance}
      </Alert>

      <ol className="flex flex-col gap-3.5">
        {guide.steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center border-2 border-accent bg-highlight font-mono text-xs font-bold text-foreground">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Text className="font-semibold">{step.instruction}</Text>
              {step.command && <CommandBlock command={step.command} />}
              {step.explanation && (
                <Text variant="body-sm" tone="secondary">
                  {step.explanation}
                </Text>
              )}
            </div>
          </li>
        ))}
      </ol>

      {guide.relatedConcepts && guide.relatedConcepts.length > 0 && (
        <div className="flex flex-col gap-2">
          <Heading level={2} size={4}>
            Worth understanding
          </Heading>
          <div className="flex flex-wrap gap-2">
            {guide.relatedConcepts.map((slug) => {
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
        </div>
      )}
    </div>
  )
}
