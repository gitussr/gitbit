import { quizQuestions } from '@/services/content'
import { Heading, Text } from '@/components/ui/Typography'
import { QuizCard } from '@/components/cards'

export default function QuizPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={1}>GitBit Quiz</Heading>
        <Text tone="secondary" className="mt-2">
          Quick checks that test understanding, not memorization.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizQuestions.map((quiz) => (
          <QuizCard key={quiz.slug} quiz={quiz} />
        ))}
      </div>
    </div>
  )
}
