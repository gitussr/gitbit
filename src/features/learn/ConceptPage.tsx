import { useNavigate, useParams } from 'react-router-dom'
import {
  getLevelBySlug,
  getLevelForConcept,
  getConceptBySlug,
  getConceptsForLevel,
  getConceptRelatedCommands,
  getRelatedConcepts,
} from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { CommandCard } from '@/components/cards'
import { cardClassName } from '@/components/ui/Card'
import { Link } from 'react-router-dom'

export default function ConceptPage() {
  const { levelSlug, conceptSlug } = useParams()
  const navigate = useNavigate()
  const level = levelSlug ? getLevelBySlug(levelSlug) : undefined
  const concept = conceptSlug ? getConceptBySlug(conceptSlug) : undefined

  if (!level || !concept || !level.conceptSlugs.includes(concept.slug)) {
    return <EmptyState title="Lesson not found" description="That concept isn't part of this level." />
  }

  const levelConcepts = getConceptsForLevel(level)
  const index = levelConcepts.findIndex((c) => c.slug === concept.slug)
  const relatedConcepts = getRelatedConcepts(concept)
  const relatedCommands = getConceptRelatedCommands(concept)

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Breadcrumbs items={[{ label: 'Learn', to: '/learn' }, { label: level.title, to: `/learn/${level.slug}` }, { label: concept.term }]} />

      <div className="flex flex-col gap-3">
        <Badge variant="accent" className="w-fit">
          {concept.category}
        </Badge>
        <Heading level={1}>{concept.term}</Heading>
        <Text variant="body-lg" tone="secondary">
          {concept.plainEnglish}
        </Text>
      </div>

      <div className="rounded-lg border border-accent-border bg-accent-subtle p-5">
        <Text variant="caption" tone="tertiary" className="mb-1 uppercase tracking-wide">
          Mental model
        </Text>
        <Text variant="body-lg" className="font-medium text-accent-strong">
          {concept.mentalModel}
        </Text>
      </div>

      <div className="flex flex-col gap-1.5">
        <Heading level={2} size={4}>
          The technical explanation
        </Heading>
        <Text tone="secondary">{concept.technicalExplanation}</Text>
      </div>

      {concept.example && <CodeBlock code={concept.example} />}

      <div className="grid gap-6 sm:grid-cols-2">
        {concept.whenToUse && (
          <div className="flex flex-col gap-1.5">
            <Heading level={2} size={4}>
              When it matters
            </Heading>
            <Text tone="secondary">{concept.whenToUse}</Text>
          </div>
        )}
        {concept.whatHappens && (
          <div className="flex flex-col gap-1.5">
            <Heading level={2} size={4}>
              What actually happens
            </Heading>
            <Text tone="secondary">{concept.whatHappens}</Text>
          </div>
        )}
      </div>

      {concept.commonMistake && (
        <Alert variant="warning" title="Common mistake">
          {concept.commonMistake}
        </Alert>
      )}

      {(relatedConcepts.length > 0 || relatedCommands.length > 0) && (
        <div className="flex flex-col gap-3">
          <Heading level={2} size={4}>
            Related
          </Heading>
          <div className="flex flex-wrap gap-4">
            {relatedConcepts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relatedConcepts.map((r) => {
                  const rLevel = getLevelForConcept(r.slug)
                  return (
                    <Link key={r.slug} to={rLevel ? `/learn/${rLevel.slug}/${r.slug}` : '/learn'} className={cardClassName(true, 'px-3 py-1.5 text-sm')}>
                      {r.term}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          {relatedCommands.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedCommands.map((c) => (
                <CommandCard key={c.slug} command={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {levelConcepts.length > 1 && (
        <Pagination
          page={index + 1}
          totalPages={levelConcepts.length}
          onPageChange={(page) => {
            const target = levelConcepts[page - 1]
            if (target) navigate(`/learn/${level.slug}/${target.slug}`)
          }}
          className="self-center"
        />
      )}
    </div>
  )
}
