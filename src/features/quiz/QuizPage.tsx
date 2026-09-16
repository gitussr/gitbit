import { quizQuestions } from '@/services/content'
import { PageHeader } from '@/components/ui/PageHeader'
import { QuizCard } from '@/components/cards'

export default function QuizPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="GitBit Quiz" description={'Quick checks that test understanding, not memorization.'} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizQuestions.map((quiz) => (
          <QuizCard key={quiz.slug} quiz={quiz} />
        ))}
      </div>
    </div>
  )
}
