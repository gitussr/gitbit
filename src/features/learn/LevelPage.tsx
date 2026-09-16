import { useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getLevelBySlug, getConceptsForLevel, getCommandsForLevel, learnLevels } from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading } from '@/components/ui/Typography'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ButtonLink } from '@/components/ui/Button'
import { LessonCard, CommandCard } from '@/components/cards'

export default function LevelPage() {
  const { levelSlug } = useParams()
  const level = levelSlug ? getLevelBySlug(levelSlug) : undefined

  if (!level) {
    return <EmptyState title="Level not found" description="That learning level doesn't exist." />
  }

  const levelConcepts = getConceptsForLevel(level)
  const levelCommands = getCommandsForLevel(level)
  const nextLevel = learnLevels.find((l) => l.order === level.order + 1)

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: 'Learn', to: '/learn' }, { label: level.title }]} />

      <PageHeader
        eyebrow={<Badge variant="accent">Level {level.order}</Badge>}
        title={level.title}
        description={level.description}
      />

      {levelConcepts.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Heading level={2} size={4}>
            Concepts
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levelConcepts.map((concept) => (
              <LessonCard key={concept.slug} concept={concept} levelSlug={level.slug} />
            ))}
          </div>
        </div>
      )}

      {levelCommands.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Heading level={2} size={4}>
            Commands
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levelCommands.map((command) => (
              <CommandCard key={command.slug} command={command} />
            ))}
          </div>
        </div>
      )}

      {nextLevel && (
        <ButtonLink
          to={`/learn/${nextLevel.slug}`}
          variant="primary"
          trailingIcon={<ArrowRight aria-hidden="true" />}
          className="self-end"
        >
          Next: {nextLevel.title}
        </ButtonLink>
      )}
    </div>
  )
}
