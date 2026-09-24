import { useState } from 'react'
import { Brain } from 'lucide-react'
import type { QuizQuestion } from '@/content/types'
import { Alert } from '@/components/ui/Alert'
import { ChoiceList } from '@/components/ui/ChoiceList'
import { panelClassName } from '@/components/ui/StatePanel'
import { Text } from '@/components/ui/Typography'

/**
 * Quick Recall (Visualizer Section 26): one Quiz question, asked right
 * after the thing it's about happened — so the answer is still on screen
 * for anyone who looks.
 *
 * A panel rather than a card: it's an offer, not the headline, and it
 * should sit quietly next to the stage until someone wants it. There is no
 * score and nothing is stored; answering is for the person, not for GitBit.
 * Mount it with a `key` per question asked, so each one starts unanswered.
 */
export function RecallCard({ quiz }: { quiz: QuizQuestion }) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null
  const headingId = `recall-${quiz.slug}`

  return (
    <section aria-labelledby={headingId} className={panelClassName(false, 'flex flex-col gap-2.5')}>
      <Text as="h2" id={headingId} variant="caption" className="inline-flex items-center gap-1.5 font-bold uppercase">
        <Brain className="size-4" aria-hidden="true" />
        Quick recall
      </Text>
      <Text className="font-semibold">{quiz.prompt}</Text>
      <ChoiceList choices={quiz.choices} correctIndex={quiz.correctIndex} selected={selected} onSelect={setSelected} size="sm" />
      {answered && (
        <Alert variant={selected === quiz.correctIndex ? 'success' : 'info'} title={selected === quiz.correctIndex ? "That's it" : 'Not quite'}>
          {quiz.explanation}
        </Alert>
      )}
    </section>
  )
}
