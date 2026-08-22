import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getLevelBySlug, getConceptsForLevel, getCommandsForLevel, learnLevels } from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
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
    <div className="flex flex-col gap-8">
      <Breadcrumbs items={[{ label: 'Learn', to: '/learn' }, { label: level.title }]} />

      <div className="flex flex-col gap-2">
        <Badge variant="accent" className="w-fit">
          Level {level.order}
        </Badge>
        <Heading level={1}>{level.title}</Heading>
        <Text variant="body-lg" tone="secondary">
          {level.description}
        </Text>
      </div>

      {levelConcepts.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={2}>Concepts</Heading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levelConcepts.map((concept) => (
              <LessonCard key={concept.slug} concept={concept} levelSlug={level.slug} />
            ))}
          </div>
        </div>
      )}

      {levelCommands.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={2}>Commands</Heading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levelCommands.map((command) => (
              <CommandCard key={command.slug} command={command} />
            ))}
          </div>
        </div>
      )}

      {nextLevel && (
        <Link to={`/learn/${nextLevel.slug}`} className="self-end">
          <Button variant="secondary" trailingIcon={<ArrowRight aria-hidden="true" />}>
            Next: {nextLevel.title}
          </Button>
        </Link>
      )}
    </div>
  )
}
