import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { quizQuestions, getQuizBySlug } from '@/services/content'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ChoiceList } from '@/components/ui/ChoiceList'
import { EmptyState } from '@/components/ui/EmptyState'

const difficultyLabel = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const

export default function QuizQuestionPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number | null>(null)
  const quiz = slug ? getQuizBySlug(slug) : undefined

  if (!quiz) {
    return <EmptyState titleAs="h1" title="Question not found" description="That quiz question doesn't exist." />
  }

  const index = quizQuestions.findIndex((q) => q.slug === quiz.slug)
  const next = quizQuestions[(index + 1) % quizQuestions.length]
  const answered = selected !== null
  const isCorrect = selected === quiz.correctIndex

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Breadcrumbs items={[{ label: 'Quiz', to: '/quiz' }, { label: `Question ${index + 1}` }]} />

      <div className="flex flex-col gap-3">
        <Badge variant="neutral" className="w-fit">
          {difficultyLabel[quiz.difficulty]}
        </Badge>
        {quiz.scenario && (
          <Text tone="tertiary" className="italic">
            {quiz.scenario}
          </Text>
        )}
        <Heading level={1} size={2}>
          {quiz.prompt}
        </Heading>
      </div>

      <ChoiceList choices={quiz.choices} correctIndex={quiz.correctIndex} selected={selected} onSelect={setSelected} />

      {answered && (
        <Alert variant={isCorrect ? 'success' : 'info'} title={isCorrect ? "That's it" : 'Not quite'}>
          {quiz.explanation}
        </Alert>
      )}

      {answered && (
        <Button
          variant="primary"
          trailingIcon={<ArrowRight aria-hidden="true" />}
          onClick={() => {
            setSelected(null)
            navigate(`/quiz/${next.slug}`)
          }}
          className="self-start"
        >
          Next question
        </Button>
      )}
    </div>
  )
}
