import { Link, useParams } from 'react-router-dom'
import { getSosBySlug, getConceptBySlug, getLevelForConcept } from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { DangerBadge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { CommandBlock } from '@/components/ui/CommandBlock'
import { EmptyState } from '@/components/ui/EmptyState'
import { cardClassName } from '@/components/ui/Card'

export default function SosDetailPage() {
  const { slug } = useParams()
  const guide = slug ? getSosBySlug(slug) : undefined

  if (!guide) {
    return <EmptyState title="Guide not found" description="That situation isn't in GitBit SOS yet." />
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <Breadcrumbs items={[{ label: 'SOS', to: '/sos' }, { label: guide.situation }]} />

      <div className="flex flex-col gap-3">
        <DangerBadge level={guide.dangerLevel} className="w-fit" />
        <Heading level={1}>{guide.situation}</Heading>
      </div>

      <Alert variant="success" title="You're okay">
        {guide.reassurance}
      </Alert>

      <ol className="flex flex-col gap-4">
        {guide.steps.map((step, index) => (
          <li key={index} className="flex gap-4">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle font-mono text-sm font-semibold text-accent-strong">
              {index + 1}
            </span>
            <div className="flex flex-1 flex-col gap-2">
              <Text className="font-medium">{step.instruction}</Text>
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
        <div className="flex flex-col gap-3">
          <Heading level={2} size={4}>
            Worth understanding
          </Heading>
          <div className="flex flex-wrap gap-2">
            {guide.relatedConcepts.map((slug) => {
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
        </div>
      )}
    </div>
  )
}
