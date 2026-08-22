import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import type { QuizQuestion } from '@/content/types'
import { cardClassName } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Typography'

const difficultyLabel: Record<QuizQuestion['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function QuizCard({ quiz }: { quiz: QuizQuestion }) {
  return (
    <Link to={`/quiz/${quiz.slug}`} className={cardClassName(true, 'flex flex-col gap-3')}>
      <div className="flex items-start justify-between gap-2">
        <HelpCircle className="size-5 text-accent" aria-hidden="true" />
        <Badge variant="neutral">{difficultyLabel[quiz.difficulty]}</Badge>
      </div>
      <Text variant="body" className="line-clamp-3 font-medium">
        {quiz.prompt}
      </Text>
    </Link>
  )
}
