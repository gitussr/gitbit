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
    <Link to={`/quiz/${quiz.slug}`} className={cardClassName(true, 'flex gap-3')}>
      <HelpCircle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <Text as="p" className="line-clamp-3 font-semibold">
          {quiz.prompt}
        </Text>
        <Badge variant="neutral">{difficultyLabel[quiz.difficulty]}</Badge>
      </div>
    </Link>
  )
}
