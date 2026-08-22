import { Link } from 'react-router-dom'
import type { GitConcept } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'

const difficultyLabel: Record<GitConcept['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function LessonCard({ concept, levelSlug }: { concept: GitConcept; levelSlug: string }) {
  return (
    <Link to={`/learn/${levelSlug}/${concept.slug}`} className={cardClassName(true, 'flex flex-col gap-3')}>
      <div className="flex items-start justify-between gap-2">
        <Badge variant="accent">{concept.category}</Badge>
        <Badge variant="neutral">{difficultyLabel[concept.difficulty]}</Badge>
      </div>
      <Heading level={4} as="p" className="text-base">
        {concept.term}
      </Heading>
      <Text variant="body-sm" tone="secondary" className="line-clamp-2">
        {concept.plainEnglish}
      </Text>
    </Link>
  )
}
