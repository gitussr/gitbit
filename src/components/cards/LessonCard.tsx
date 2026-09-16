import { Link } from 'react-router-dom'
import type { GitConcept } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Typography'

const difficultyLabel: Record<GitConcept['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function LessonCard({ concept, levelSlug }: { concept: GitConcept; levelSlug: string }) {
  return (
    <Link to={`/learn/${levelSlug}/${concept.slug}`} className={cardClassName(true, 'flex flex-col gap-1.5')}>
      <div className="flex items-center justify-between gap-2">
        <Text as="p" className="font-semibold">
          {concept.term}
        </Text>
        <Badge variant="neutral">{difficultyLabel[concept.difficulty]}</Badge>
      </div>
      <Text variant="body-sm" tone="secondary" className="line-clamp-2">
        {concept.plainEnglish}
      </Text>
      <Text variant="caption" className="font-semibold text-accent-strong">
        {concept.category}
      </Text>
    </Link>
  )
}
